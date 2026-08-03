"use client";
import { useState } from "react";

interface BlockItem {
  title: string;
  content: string;
}

interface CopyDisplayProps {
  content: string;
}

export default function CopyDisplay({ content }: CopyDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const detectContentType = (text: string): 'copys' | 'videos' => {
    return text.includes('COPY') && text.match(/COPY\s+\d+/i) ? 'copys' : 'videos';
  };

  const parseJsonBlocks = (text: string): BlockItem[] => {
    const blocks: BlockItem[] = [];
    let braceCount = 0;
    let startIdx = -1;
    let cenaNum = 1;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '{') {
        if (braceCount === 0) {
          startIdx = i;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && startIdx !== -1) {
          const jsonBlock = text.substring(startIdx, i + 1);
          if (jsonBlock.trim().length > 2) {
            blocks.push({
              title: `CENA ${cenaNum}`,
              content: jsonBlock
            });
            cenaNum++;
          }
          startIdx = -1;
        }
      }
    }

    return blocks;
  };

  const parseCopyBlocks = (text: string): BlockItem[] => {
    const blocks: BlockItem[] = [];
    const copyRegex = /COPY\s+(\d+)([\s\S]*?)(?=COPY\s+\d+|$)/gi;
    let match;
    let copyNum = 1;

    while ((match = copyRegex.exec(text)) !== null) {
      const copyContent = match[0];
      blocks.push({
        title: `COPY ${copyNum}`,
        content: copyContent.trim()
      });
      copyNum++;
    }

    if (blocks.length === 0) {
      const lines = text.split('\n');
      let currentCopy = '';
      let copyNumber = 1;

      for (const line of lines) {
        if (line.match(/COPY\s+\d+/i)) {
          if (currentCopy) {
            blocks.push({
              title: `COPY ${copyNumber}`,
              content: currentCopy.trim()
            });
            copyNumber++;
          }
          currentCopy = line + '\n';
        } else {
          currentCopy += line + '\n';
        }
      }

      if (currentCopy) {
        blocks.push({
          title: `COPY ${copyNumber}`,
          content: currentCopy.trim()
        });
      }
    }

    return blocks;
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text.trim());
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const contentType = detectContentType(content);
  const blocks = contentType === 'copys'
    ? parseCopyBlocks(content)
    : parseJsonBlocks(content);

  return (
    <div className="copy-container">
      {blocks.map((block, idx) => (
        <div key={idx} className="block-box">
          <div className="block-header">
            <h2>{block.title}</h2>
            <button
              onClick={() => handleCopy(block.content, idx)}
              className={`copy-button ${copiedIndex === idx ? 'copied' : ''}`}
            >
              {copiedIndex === idx ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="block-content">
            {block.content.split('\n').map((line, lineIdx) =>
              line.trim() && <p key={lineIdx}>{line}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
