"use client";
import { useState } from "react";

interface CopyDisplayProps {
  content: string;
}

export default function CopyDisplay({ content }: CopyDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedRevisedIndex, setCopiedRevisedIndex] = useState<number | null>(null);
  const [copiedRevisedAll, setCopiedRevisedAll] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<string>("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [revisedCopy, setRevisedCopy] = useState<string>("");

  const parseCopys = (text: string) => {
    const scenes = [];
    const lines = text.split('\n');
    let currentScene = { title: '', content: '' };

    for (const line of lines) {
      // Ignora linhas que sejam só crases (depois de tirar espaços)
      if (/^`+$/.test(line.trim())) {
        continue;
      }

      // Detecta "CENA 1 — FAB:", "CENA 1 - FAB:", etc (aceita ambos — e -)
      if (line.includes('CENA') && (line.includes('—') || line.includes('-'))) {
        if (currentScene.content && currentScene.title.trim() !== '') scenes.push(currentScene);
        currentScene = {
          title: line.trim(),
          content: ''
        };
      } else if (line.trim() && !line.startsWith('#') && !line.includes('---')) {
        currentScene.content += line + '\n';
      }
    }
    if (currentScene.content && currentScene.title.trim() !== '') scenes.push(currentScene);
    return scenes;
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text.trim());
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(content);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    setEvaluation("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "avaliador-copy",
          messages: [{ role: "user", content }]
        }),
      });

      if (!res.ok || !res.body) {
        setEvaluation("Erro ao avaliar copy.");
        setEvaluating(false);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setEvaluation(acc);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de conexão";
      setEvaluation(`Erro: ${msg}`);
    } finally {
      setEvaluating(false);
    }
  };

  const handleRewrite = async () => {
    setIsRewriting(true);
    setRevisedCopy("");
    try {
      const feedbackMessage = `COPY ORIGINAL:\n${content}\n\nAVALIAÇÃO:\n${evaluation}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "reescrever-copy",
          messages: [{ role: "user", content: feedbackMessage }]
        }),
      });

      if (!res.ok || !res.body) {
        setRevisedCopy("Erro ao reescrever copy.");
        setIsRewriting(false);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setRevisedCopy(acc);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de conexão";
      setRevisedCopy(`Erro: ${msg}`);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopyRevised = (text: string, index: number) => {
    navigator.clipboard.writeText(text.trim());
    setCopiedRevisedIndex(index);
    setTimeout(() => setCopiedRevisedIndex(null), 2000);
  };

  const handleCopyRevisedAll = () => {
    navigator.clipboard.writeText(revisedCopy);
    setCopiedRevisedAll(true);
    setTimeout(() => setCopiedRevisedAll(false), 2000);
  };

  const scenes = parseCopys(content);
  const revisedScenes = revisedCopy ? parseCopys(revisedCopy) : [];

  return (
    <div className="copy-container">
      {/* Header com botões "Copiar tudo" e "Avaliar" */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "16px",
        flexWrap: "wrap"
      }}>
        <button
          onClick={handleCopyAll}
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            background: copiedAll ? "rgba(34,197,94,0.2)" : "rgba(0,217,255,0.1)",
            border: `1px solid ${copiedAll ? "rgba(34,197,94,0.4)" : "rgba(0,217,255,0.2)"}`,
            color: copiedAll ? "#22c55e" : "#00d9ff",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          {copiedAll ? "✓ Copiado!" : "Copiar tudo"}
        </button>

<button
          onClick={handleEvaluate}
          disabled={evaluating}
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            background: evaluating ? "rgba(192,132,252,0.2)" : "rgba(192,132,252,0.1)",
            border: `1px solid ${evaluating ? "rgba(192,132,252,0.4)" : "rgba(192,132,252,0.2)"}`,
            color: evaluating ? "#c084fc" : "#a78bfa",
            cursor: evaluating ? "not-allowed" : "pointer",
            opacity: evaluating ? 0.7 : 1,
            transition: "all 0.2s ease"
          }}
        >
          {evaluating ? "Avaliando..." : "Avaliar copy"}
        </button>

        {evaluation && !evaluation.includes("Erro") && (
          <button
            onClick={handleRewrite}
            disabled={isRewriting}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              background: isRewriting ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.1)",
              border: `1px solid ${isRewriting ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.2)"}`,
              color: isRewriting ? "#3b82f6" : "#60a5fa",
              cursor: isRewriting ? "not-allowed" : "pointer",
              opacity: isRewriting ? 0.7 : 1,
              transition: "all 0.2s ease"
            }}
          >
            {isRewriting ? "Reescrevendo..." : "Refazer copy"}
          </button>
        )}
      </div>

      {/* Cenas */}
      {scenes.map((scene, idx) => (
        <div key={idx} className="copy-scene-box">
          <div className="scene-header">
            <h3>{scene.title}</h3>
            <button
              onClick={() => handleCopy(scene.content, idx)}
              className={`copy-button ${copiedIndex === idx ? 'copied' : ''}`}
            >
              {copiedIndex === idx ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="scene-content">
            {scene.content.split('\n').map((line, lineIdx) =>
              line.trim() && <p key={lineIdx}>{line}</p>
            )}
          </div>
        </div>
      ))}

      {/* Avaliação */}
      {evaluation && (
        <div style={{
          marginTop: "20px",
          padding: "16px",
          borderRadius: "8px",
          background: "rgba(192,132,252,0.08)",
          border: "1px solid rgba(192,132,252,0.2)",
          fontSize: "13px",
          lineHeight: "1.6",
          color: "#e0e6ff",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          <div style={{ fontWeight: 700, marginBottom: "12px", color: "#c084fc" }}>
            Avaliação da Copy
          </div>
          {evaluation}
        </div>
      )}

      {/* Copy Revisada */}
      {revisedCopy && !revisedCopy.includes("Erro") && (
        <div style={{ marginTop: "28px" }}>
          {/* Header com botões "Copiar tudo revisada" */}
          <div style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap"
          }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#3b82f6", width: "100%" }}>
              Copy Revisada
            </div>
            <button
              onClick={handleCopyRevisedAll}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                background: copiedRevisedAll ? "rgba(34,197,94,0.2)" : "rgba(59,130,246,0.1)",
                border: `1px solid ${copiedRevisedAll ? "rgba(34,197,94,0.4)" : "rgba(59,130,246,0.2)"}`,
                color: copiedRevisedAll ? "#22c55e" : "#3b82f6",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {copiedRevisedAll ? "✓ Copiado!" : "Copiar tudo"}
            </button>
          </div>

          {/* Cenas Revisadas */}
          {revisedScenes.map((scene, idx) => (
            <div key={idx} className="copy-scene-box">
              <div className="scene-header">
                <h3>{scene.title}</h3>
                <button
                  onClick={() => handleCopyRevised(scene.content, idx)}
                  className={`copy-button ${copiedRevisedIndex === idx ? 'copied' : ''}`}
                >
                  {copiedRevisedIndex === idx ? '✓ Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="scene-content">
                {scene.content.split('\n').map((line, lineIdx) =>
                  line.trim() && <p key={lineIdx}>{line}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
