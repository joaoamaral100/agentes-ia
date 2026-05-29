import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `Você é JARVIS, um assistente de IA especializado em ajudar criadores de conteúdo do TikTok Shopping a usar a plataforma JARVIS. Você responde de forma curta, direta e em português brasileiro. Você conhece os 3 agentes: Gerador de Imagens (cria prompts de imagem), Gerador de Copys (cria textos de venda), Gerador de Vídeos (cria prompts de vídeo). Você explica como usar cada um de forma simples. Máximo 3 frases por resposta. Comece sempre com: Sim, [nome da ação]...`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key não configurada." }, { status: 500 });
  }

  let text: string;
  try {
    const body = await req.json();
    text = body.text;
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (!text?.trim()) {
    return Response.json({ error: "Nenhum texto enviado." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });

  const response =
    message.content[0].type === "text" ? message.content[0].text : "";

  return Response.json({ response });
}
