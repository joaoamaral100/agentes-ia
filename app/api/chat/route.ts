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
          videos: { temperature: 0, max_tokens: 4096 },
          imagens: { temperature: 0.7, max_tokens: 4096 },
          copys: { temperature: 0.9, max_tokens: 4096 },
          "mode-amaral": { temperature: 0.7, max_tokens: 4096 },
        };

        const config = agentConfig[agentId || ""] || { temperature: 0.7, max_tokens: 4096 };
        const model = agentId === "videos" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";

        const videosSystemPrompt = `Você recebe imagens de um produto e copys de 3 cenas. Gere APENAS 3 JSONs separados neste formato exato:

{\"cena\":1,\"prompt\":{\"formato\":\"Vídeo vertical 9:16, UGC realista.\",\"referencia_produto\":\"[descreva o produto da imagem]\",\"cena\":\"[o que acontece, 2 frases]\",\"anatomia\":\"1 pessoa, 2 mãos, 5 dedos cada, sem duplicações.\",\"acoes\":\"[ações naturais, 2 frases, sem timestamps]\",\"camera\":\"[enquadramento, 1 frase]\",\"audio\":{\"voz\":\"Feminina, brasileira, natural.\",\"fala_exata\":\"[copy exata]\",\"sincronizacao\":\"Fala contínua e sincronizada.\"},\"restricoes\":[\"Sem texto.\",\"Sem legendas.\",\"Sem logos.\",\"Movimento natural.\",\"1 pessoa, 2 mãos, 5 dedos.\"]}}

Nunca adicionar referencia_visual, composicao_frame, iluminacao, camera_tecnica, sincronizacao_PERFEITA ou timestamps.`;

        const systemPrompt = agentId === "videos" ? videosSystemPrompt : agent.systemPrompt;

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
