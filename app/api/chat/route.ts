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

  const cleanVideosJSON = (text: string): string => {
    try {
      const jsonMatches = text.match(/\{\s*"cena"[\s\S]*?\n\}/g);
      if (!jsonMatches || jsonMatches.length === 0) return text;

      const cleaned = jsonMatches.map((jsonStr) => {
        const parsed = JSON.parse(jsonStr);
        return {
          cena: parsed.cena,
          visual: parsed.visual,
          audio: parsed.audio,
          restricoes: parsed.restricoes,
        };
      });

      return `[\n${cleaned.map((j) => JSON.stringify(j)).join(",\n")}\n]`;
    } catch {
      return text;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const agentConfig: Record<string, { temperature: number; max_tokens: number }> = {
          videos: { temperature: 0, max_tokens: 800 },
          imagens: { temperature: 0.7, max_tokens: 4096 },
          copys: { temperature: 0.9, max_tokens: 4096 },
          "mode-amaral": { temperature: 0.7, max_tokens: 4096 },
        };

        const config = agentConfig[agentId || ""] || { temperature: 0.7, max_tokens: 4096 };

        const processedMessages = agentId === "videos"
          ? [
              { role: "assistant" as const, content: '[\n{' },
              ...messages
            ]
          : messages;

        const messageStream = anthropic.messages.stream({
          model: "claude-haiku-4-5-20251001",
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          system: agent.systemPrompt,
          messages: processedMessages.map((m) => {
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

        let fullText = "";
        messageStream.on("text", (text) => {
          fullText += text;
        });

        await messageStream.finalMessage();

        const processedText = agentId === "videos" ? cleanVideosJSON(fullText) : fullText;
        controller.enqueue(encoder.encode(processedText));
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
