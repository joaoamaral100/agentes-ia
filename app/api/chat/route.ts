import Anthropic from "@anthropic-ai/sdk";
import { getAgent } from "@/lib/agents";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ImageData {
  base64: string;
  mediaType: string;
}

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
  images?: ImageData[];
  apiText?: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY não configurada. Adicione a chave no arquivo .env.local (local) ou nas Environment Variables da Vercel.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { agentId?: string; messages?: IncomingMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Corpo da requisição inválido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { agentId, messages } = body;
  const agent = agentId ? getAgent(agentId) : undefined;

  if (!agent) {
    return new Response(JSON.stringify({ error: "Agente inválido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Nenhuma mensagem enviada." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const anthropic = new Anthropic({ apiKey });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const agentConfig: Record<string, { temperature: number; max_tokens: number }> = {
          videos: { temperature: 0, max_tokens: 2000 },
          imagens: { temperature: 0.7, max_tokens: 4096 },
          copys: { temperature: 0.9, max_tokens: 4096 },
          "mode-amaral": { temperature: 0.7, max_tokens: 4096 },
        };

        const config = agentConfig[agentId || ""] || { temperature: 0.7, max_tokens: 4096 };
        const model = "claude-haiku-4-5-20251001";

        const videosSystemPrompt = `Você recebe imagens de um produto e copys de 3 cenas. Gere APENAS 3 JSONs separados neste formato exato:

{\"cena\":1,\"prompt\":{\"formato\":\"Vídeo vertical 9:16, UGC realista.\",\"referencia_produto\":\"[descreva o produto da imagem]\",\"cena\":\"[o que acontece, 2 frases]\",\"anatomia\":\"1 pessoa, 2 mãos, 5 dedos cada, sem duplicações.\",\"acoes\":\"[ações naturais, 2 frases, sem timestamps]\",\"camera\":\"[enquadramento, 1 frase]\",\"audio\":{\"voz\":\"Feminina, brasileira, natural.\",\"fala_exata\":\"[copy exata]\",\"sincronizacao\":\"Fala contínua e sincronizada.\"},\"restricoes\":[\"Sem texto.\",\"Sem legendas.\",\"Sem logos.\",\"Movimento natural.\",\"1 pessoa, 2 mãos, 5 dedos.\"]}}

Nunca adicionar referencia_visual, composicao_frame, iluminacao, camera_tecnica, sincronizacao_PERFEITA ou timestamps.`;

        const formattersSystemPrompt = `Você é um formatador JSON. Receba o texto abaixo e extraia APENAS as informações essenciais, reformatando em exatamente 3 JSONs neste formato:

{\"cena\":1,\"prompt\":{\"referencia_produto\":\"[produto da imagem em 1 frase]\",\"cena\":\"[o que acontece em 2 frases]\",\"anatomia\":\"1 pessoa, 2 mãos, 5 dedos cada.\",\"acoes\":\"[ações em 2 frases sem timestamps]\",\"camera\":\"[1 frase]\",\"audio\":{\"voz\":\"Feminina, brasileira, natural.\",\"fala_exata\":\"[copy exata]\",\"sincronizacao\":\"Fala contínua e sincronizada.\"},\"restricoes\":[\"Sem texto.\",\"Sem legendas.\",\"Sem logos.\",\"Movimento natural.\"]}}

Retorne APENAS os 3 JSONs. Nada mais.`;

        if (agentId === "videos") {
          const scenesystemPrompt = `GARANTIA CRÍTICA - VOCÊ SEMPRE RECEBE TUDO JUNTO: As imagens E o texto SEMPRE chegam juntos NA MESMA MENSAGEM. NUNCA diga que falta informação. NUNCA peça nada. A ÚNICA SAÍDA POSSÍVEL é UM PARÁGRAFO CORRIDO de texto, pronto pra colar no Veo 3.

NUNCA faça perguntas. NUNCA peça confirmação. Sempre gere o parágrafo direto, fluido, natural, sem estruturas, sem rótulos, sem JSON.

CADA CENA É AVULSA (não um pacote de 3). Gere 1 PARÁGRAFO por chamada, apenas para a cena atual, contendo de forma integrada e fluida:
- Formato do vídeo (vertical 9:16, UGC realista)
- Descrição FIEL do produto visto nas imagens (cor, formato, material, acessórios visíveis - NUNCA inventar ou trocar)
- O que acontece na cena e as ações naturais
- Anatomia: sempre 1 pessoa, 2 mãos com 5 dedos cada, SEMPRE VISÍVEIS
- Enquadramento de câmera
- Voz com gênero (não fixo em feminino - inferir pelo produto ou respeitar se indicado no texto) e a fala entre aspas
- Restrições no final (sem texto, sem legendas, sem logos, movimento natural)

ATENÇÃO CRÍTICA À FALA: O que está entre aspas é um COPIAR E COLAR literal das 2 linhas daquela cena. Nunca reescreva, adapte ou invente palavras. Se você escrever qualquer palavra que não estava no texto do usuário, você falhou. Copie caractere por caractere.

DETECÇÃO DE FORMATO POR CENA: o usuário marca o formato de cada cena assim: "CENA 1 - unboxing", "CENA 2 - fábrica" ou "fabrica", "CENA 3 - terceira pessoa", etc. Aceita variações: ":" em vez de "-", abreviações (unb, fab, tp, pov), COM ou SEM acentos (fábrica = fabrica, etc). Localize no texto a linha da CENA QUE VOCÊ ESTÁ GERANDO e leia qual formato está marcado. Aplique APENAS esse formato nesta cena. Se não houver formato marcado, use UNBOXING só para ela.

FORMATOS (fábrica e fabrica são o mesmo formato):
- UNBOXING: POV, só mãos, caixa ou produto sobre a mesa, enquadramento fechado de cima, mãos manuseiam e exploram.
- FÁBRICA / FABRICA: foco no produto e seus detalhes, produto sendo demonstrado ou funcionando, enquadramento de média distância.
- POV: primeira pessoa, só mãos, descobrindo ou testando o produto, movimento natural.
- TERCEIRA PESSOA: mostra a PESSOA (corpo/tronco visível, nunca só mãos), câmera afastada pra ver a pessoa, ela usa ou apresenta o produto pra câmera.

REGRA DA FALA: o texto contém 3 cenas, cada uma com 2 linhas. A fala entre aspas deve conter APENAS as 2 linhas exatas daquela cena, copiadas como estão:
Cena 1 = as 2 linhas sob 'CENA 1'
Cena 2 = as 2 linhas sob 'CENA 2'
Cena 3 = as 2 linhas sob 'CENA 3'

PROIBIDO: juntar linhas de cenas diferentes. PROIBIDO: reescrever, resumir ou adaptar. Máximo 20 palavras entre as aspas.

EXEMPLO do resultado ideal:
"Vídeo vertical 9:16, UGC realista. Mãos femininas seguram uma caixa de papelão fechada e lacrada do TikTok Shop, com etiqueta de envio visível, sobre uma mesa de madeira clara. As mãos giram a caixa devagar e deslizam os dedos pela etiqueta, mantendo-a fechada o tempo todo. Apenas 1 pessoa, 2 mãos com 5 dedos cada, sempre visíveis, anatomia natural. Câmera de smartphone estável, enquadramento fechado de cima, sem cortes. Voz feminina brasileira natural, falando de forma contínua: 'Não é possível que isso custa trinta reais. Chegou aqui em casa e achei que era fake.' Sem texto na tela, sem legendas, sem logos, movimento natural."`;

          // Preparar para 3 chamadas separadas, com imagens correspondentes
          const userMessage = [...messages].reverse().find((m) => m.role === "user");
          const userText = userMessage?.apiText ?? userMessage?.content ?? "";
          const imageData = userMessage?.images || [];

          // Função para extrair apenas o bloco da cena atual
          const extractSceneBlock = (text: string, sceneNum: number): string => {
            // Regex que encontra "CENA N" (case-insensitive, aceita espaços variáveis)
            const searchPattern = new RegExp(`CENA\\s+${sceneNum}\\b`, 'i');
            const nextPattern = new RegExp(`CENA\\s+${sceneNum + 1}\\b`, 'i');

            const sceneStartIdx = text.search(searchPattern);
            if (sceneStartIdx === -1) {
              console.log(`⚠️ Marcador CENA ${sceneNum} não encontrado, usando texto completo como fallback`);
              return text;
            }

            // Encontra o início da próxima cena
            const remainingText = text.substring(sceneStartIdx + 1);
            const nextSceneIdx = remainingText.search(nextPattern);
            let sceneEndIdx: number;

            if (nextSceneIdx === -1) {
              // Não há próxima cena, vai até o fim
              sceneEndIdx = text.length;
            } else {
              // Vai até o início da próxima cena
              sceneEndIdx = sceneStartIdx + 1 + nextSceneIdx;
            }

            return text.substring(sceneStartIdx, sceneEndIdx).trim();
          };

          // Fazer 3 chamadas separadas, uma por cena
          const responses: string[] = [];

          for (let sceneNum = 1; sceneNum <= 3; sceneNum++) {
            console.log(`\n🎬 Iniciando processamento da CENA ${sceneNum}...`);
            const messageContent: any[] = [];

            // Extrair apenas o bloco da cena atual
            const sceneBlock = extractSceneBlock(userText, sceneNum);
            console.log(`📝 Bloco extraído para CENA ${sceneNum}:`, sceneBlock.substring(0, 100) + (sceneBlock.length > 100 ? '...' : ''));

            // Adicionar TODAS as imagens em cada chamada
            if (imageData.length > 0) {
              imageData.forEach((img) => {
                messageContent.push({
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: img.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                    data: img.base64,
                  },
                });
              });
            }

            // Adicionar apenas o bloco da cena atual
            messageContent.push({
              type: "text" as const,
              text: sceneBlock,
            });

            const sceneMessage = await anthropic.messages.create({
              model,
              temperature: 0,
              max_tokens: 400,
              system: scenesystemPrompt,
              messages: [
                {
                  role: "user",
                  content: messageContent,
                },
              ],
            });

            const sceneResponse = sceneMessage.content[0].type === "text" ? sceneMessage.content[0].text : "";
            console.log(`✅ Resposta CENA ${sceneNum}:`, sceneResponse);
            console.log(`📊 Total de respostas até agora: ${sceneNum}`);
            responses.push(sceneResponse);
          }

          // Fazer stream das 3 respostas concatenadas com cabeçalhos de cena
          const concatenated = responses
            .map((response, idx) => `CENA ${idx + 1} —\n${response}`)
            .join("\n\n");
          for (const char of concatenated) {
            controller.enqueue(encoder.encode(char));
          }
        } else {
          // Outros agentes: streaming normal
          const systemPrompt = agent.systemPrompt;

          const messageStream = anthropic.messages.stream({
            model,
            temperature: config.temperature,
            max_tokens: config.max_tokens,
            system: systemPrompt,
            messages: messages.map((m) => {
              if (m.images && m.images.length > 0) {
                return {
                  role: m.role,
                  content: [
                    ...m.images.map((img) => ({
                      type: "image" as const,
                      source: {
                        type: "base64" as const,
                        media_type: img.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                        data: img.base64,
                      },
                    })),
                    { type: "text" as const, text: m.apiText ?? m.content },
                  ],
                };
              }
              return { role: m.role, content: m.apiText ?? m.content };
            }),
          });

          messageStream.on("text", (text) => {
            controller.enqueue(encoder.encode(text));
          });

          await messageStream.finalMessage();
        }

        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido ao chamar a API do Claude.";
        controller.enqueue(encoder.encode(`\n\n[Erro: ${message}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
