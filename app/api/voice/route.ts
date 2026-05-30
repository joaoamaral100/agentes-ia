import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `Você é JARVIS, um assistente de IA especializado em ajudar criadores de conteúdo do TikTok Shopping a usar a plataforma JARVIS. Responda em português brasileiro, sem emojis, sem markdown, texto limpo e natural. Máximo 2 frases por resposta.`;

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  // type === 'whisper': transcrição de áudio com OpenAI Whisper
  if (contentType.includes("multipart/form-data")) {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return Response.json({ error: "OpenAI API key não configurada." }, { status: 500 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    if (!audioFile) {
      return Response.json({ error: "Nenhum áudio enviado." }, { status: 400 });
    }

    const whisperForm = new FormData();
    whisperForm.append("file", audioFile);
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "pt");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      return Response.json({ error: "Erro na transcrição." }, { status: 500 });
    }
    const data = await whisperRes.json();
    return Response.json({ transcript: data.text ?? "" });
  }

  // JSON body: chat ou tts
  let body: { text?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { text, type } = body;

  // type === 'tts': síntese de voz com OpenAI TTS
  if (type === "tts") {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return Response.json({ error: "OpenAI API key não configurada." }, { status: 500 });
    }
    if (!text?.trim()) {
      return Response.json({ error: "Nenhum texto enviado." }, { status: 400 });
    }

    const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "tts-1", voice: "onyx", speed: 0.9, input: text }),
    });

    if (!ttsRes.ok) {
      return Response.json({ error: "Erro ao gerar áudio." }, { status: 500 });
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  }

  // type === 'chat': resposta de texto com Claude
  if (type !== "chat") {
    return Response.json({ error: "Tipo inválido." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key não configurada." }, { status: 500 });
  }
  if (!text?.trim()) {
    return Response.json({ error: "Nenhum texto enviado." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: "claude-haiku-20240307",
    max_tokens: 150,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });

  const response =
    message.content[0].type === "text" ? message.content[0].text : "";

  return Response.json({ response });
}
