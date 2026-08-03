"use client";
import { useState } from "react";

interface CopyDisplayProps {
  content: string;
}

export default function CopyDisplay({ content }: CopyDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const parseJsonBlocks = (text: string) => {
    const blocks = [];
    let braceCount = 0;
    let startIdx = -1;
    let cenaNum = 1;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '{') {
        if (braceCount === 0) startIdx = i;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && startIdx !== -1) {
          const jsonBlock = text.substring(startIdx, i + 1);
          if (jsonBlock.trim().length > 2) {
            blocks.push({ title: `CENA ${cenaNum}`, content: jsonBlock });
            cenaNum++;
          }
          startIdx = -1;
        }
      }
    }
    return blocks;
  };

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

  const hasJsonBlocks = text => {
    const jsonRegex = /\{[\s\S]*?\}/;
    return jsonRegex.test(text);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text.trim());
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isJson = hasJsonBlocks(content);
  const blocks = isJson ? parseJsonBlocks(content) : parseCopys(content);

  return (
    <div className="copy-container">
      {blocks.map((block, idx) => (
        <div key={idx} className="copy-scene-box">
          <div className="scene-header">
            <h3>{block.title}</h3>
            <button
              onClick={() => handleCopy(block.content, idx)}
              className={`copy-button ${copiedIndex === idx ? 'copied' : ''}`}
            >
              {copiedIndex === idx ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="scene-content">
            {block.content.split('\n').map((line, lineIdx) =>
              line.trim() && <p key={lineIdx}>{line}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
