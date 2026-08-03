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
          const scenesystemPrompt = `ATENÇÃO CRÍTICA: você NÃO é um redator. Você NUNCA escreve copy nova. O campo fala_exata é um COPIAR E COLAR literal das linhas que o usuário enviou para aquela cena. Se você escrever qualquer palavra que não estava no texto do usuário, você falhou. Copie caractere por caractere, sem mudar nada, sem reescrever, sem adaptar, sem inventar.

FORMATO: o usuário informa o formato no texto (unboxing, fábrica, pov, terceira pessoa). Detecte e siga:

UNBOXING:
Cena 1 = pessoa recebendo/abrindo a caixa de entrega, produto ainda embalado
Cena 2 = produto fora da caixa sendo testado/usado
Cena 3 = pessoa segura o produto olhando pra câmera, gesto discreto pra baixo

FÁBRICA:
Cena 1 = problema/dor do cliente sem o produto
Cena 2 = produto resolvendo o problema
Cena 3 = prova social e CTA

POV:
Cena 1 = primeira pessoa descobrindo o produto
Cena 2 = primeira pessoa testando
Cena 3 = recomendação com gesto pra baixo

TERCEIRA PESSOA:
Cena 1 = alguém usando o produto, câmera afastada
Cena 2 = close no produto em uso
Cena 3 = pessoa recomendando pra câmera

Se o formato não for informado, PERGUNTE qual formato antes de gerar.

Gere APENAS 1 JSON para esta cena específica. Formato obrigatório:
{\"cena\":NUMERO,\"prompt\":{\"referencia_produto\":\"1 frase\",\"cena\":\"2 frases\",\"anatomia\":\"1 pessoa, 2 mãos, 5 dedos.\",\"acoes\":\"2 frases\",\"camera\":\"1 frase\",\"audio\":{\"voz\":\"Feminina, brasileira, natural.\",\"fala_exata\":\"COPY_AQUI\",\"sincronizacao\":\"Fala contínua.\"},\"restricoes\":[\"Sem texto.\",\"Sem legendas.\",\"Sem logos.\",\"Movimento natural.\"]}}

REGRA DO ÁUDIO: o texto recebido contém 3 cenas, cada uma com 2 linhas. O campo fala_exata deve conter APENAS as 2 linhas da cena que você está gerando, copiadas exatamente como estão.

Cena 1 = as 2 linhas sob 'CENA 1'
Cena 2 = as 2 linhas sob 'CENA 2'
Cena 3 = as 2 linhas sob 'CENA 3'

PROIBIDO: juntar linhas de cenas diferentes. PROIBIDO: colocar a copy inteira numa cena só. PROIBIDO: reescrever ou resumir as linhas. Máximo 20 palavras por fala_exata.

PROIBIDO GERAL: mais de 1 frase por campo. PROIBIDO: timestamps. PROIBIDO: campos extras.`;

          // Preparar para 3 chamadas separadas, apenas com texto (sem imagens)
          const userMessage = messages.find((m) => m.role === "user");
          const userText = userMessage?.apiText ?? userMessage?.content ?? "";

          // Fazer 3 chamadas separadas, uma por cena
          const responses: string[] = [];

          for (let sceneNum = 1; sceneNum <= 3; sceneNum++) {
            const sceneMessage = await anthropic.messages.create({
              model,
              temperature: 0,
              max_tokens: 400,
              system: scenesystemPrompt,
              messages: [
                {
                  role: "user",
                  content: `Cena ${sceneNum}: ${userText}`,
                },
              ],
            });

            const sceneResponse = sceneMessage.content[0].type === "text" ? sceneMessage.content[0].text : "";
            responses.push(sceneResponse);
          }

          // Fazer stream das 3 respostas concatenadas
          const concatenated = responses.join("\n");
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
