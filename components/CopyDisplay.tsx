"use client";
import { useState } from "react";

interface CopyDisplayProps {
  content: string;
}

export default function CopyDisplay({ content }: CopyDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scenes = content.split("\n\n").filter(s => s.trim());

  return (
    <div className="copy-display">
      {scenes.map((scene, idx) => (
        <div key={idx} className="copy-scene">
          <div className="copy-content">
            {scene.split("\n").map((line, lineIdx) => (
              <p key={lineIdx}>{line}</p>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className={`copy-btn ${copied ? 'copied' : ''}`}
          >
            {copied ? '✓ Copiado!' : 'Copiar'}
          </button>
        </div>
      ))}
    </div>
  );
}
