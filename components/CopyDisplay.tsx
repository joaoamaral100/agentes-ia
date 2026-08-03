"use client";
import { useState } from "react";

interface Scene {
  title: string;
  content: string;
}

interface Copy {
  scenes: Scene[];
}

interface CopyDisplayProps {
  content: string;
}

export default function CopyDisplay({ content }: CopyDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const parseCopys = (text: string) => {
    const scenes: Scene[] = [];
    const lines = text.split('\n');
    let currentScene = { title: '', content: '' };

    for (const line of lines) {
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

  const groupScenesCopys = (scenes: Scene[]): Copy[] => {
    const copys: Copy[] = [];
    for (let i = 0; i < scenes.length; i += 3) {
      copys.push({
        scenes: scenes.slice(i, i + 3)
      });
    }
    return copys;
  };

  const handleCopy = (copy: Copy, index: number) => {
    const copyText = copy.scenes
      .map(scene => `${scene.title}\n${scene.content}`)
      .join('\n');
    navigator.clipboard.writeText(copyText.trim());
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const scenes = parseCopys(content);
  const copys = groupScenesCopys(scenes);

  return (
    <div className="copy-container">
      {copys.map((copy, copyIdx) => (
        <div key={copyIdx} className="copy-box">
          <div className="copy-header">
            <h2>COPY {copyIdx + 1}</h2>
            <button
              onClick={() => handleCopy(copy, copyIdx)}
              className={`copy-button ${copiedIndex === copyIdx ? 'copied' : ''}`}
            >
              {copiedIndex === copyIdx ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="copy-scenes">
            {copy.scenes.map((scene, sceneIdx) => (
              <div key={sceneIdx} className="scene-content">
                <h3>{scene.title}</h3>
                <div className="scene-text">
                  {scene.content.split('\n').map((line, lineIdx) =>
                    line.trim() && <p key={lineIdx}>{line}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
