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
        const messageStream = anthropic.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 2048,
          system: agent.systemPrompt,
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
