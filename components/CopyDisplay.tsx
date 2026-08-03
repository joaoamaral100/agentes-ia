"use client";
import { useState } from "react";

interface CopyDisplayProps {
  content: string;
}

export default function CopyDisplay({ content }: CopyDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const parseCopys = (text: string) => {
    const scenes = [];
    const lines = text.split('\n');
    let currentScene = { title: '', content: '' };

    for (const line of lines) {
      // Detecta "CENA 1 — FAB:", "CENA 2 — FAB:", etc
      if (line.includes('CENA') && line.includes('—')) {
        if (currentScene.content) scenes.push(currentScene);
        currentScene = {
          title: line.trim(),
          content: ''
        };
      } else if (line.trim() && !line.startsWith('#') && !line.includes('---')) {
        currentScene.content += line + '\n';
      }
    }
    if (currentScene.content) scenes.push(currentScene);
    return scenes;
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text.trim());
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const scenes = parseCopys(content);

  return (
    <div className="copy-container">
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
    </div>
  );
}
