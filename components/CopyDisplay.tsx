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

  const parseCopyBlocks = (text: string): BlockItem[] => {
    const blocks: BlockItem[] = [];
    const parts = text.split(/(?=COPY\s+\d+)/i);
    let copyNum = 1;
    for (const part of parts) {
      if (part.trim()) {
        blocks.push({ title: `COPY ${copyNum}`, content: part.trim() });
        copyNum++;
      }
    }
    return blocks;
  };

  const formatJson = (jsonStr: string): string => {
    try { return JSON.stringify(JSON.parse(jsonStr), null, 2); }
    catch { return jsonStr; }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text.trim());
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const contentType = detectContentType(content);
  const blocks = contentType === 'copys' ? parseCopyBlocks(content) : parseJsonBlocks(content);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {blocks.map((block, idx) => (
        <div key={idx} style={{
          background: 'rgba(15, 21, 53, 0.9)',
          border: '1px solid rgba(0, 217, 255, 0.3)',
          borderRadius: '12px',
          overflow: 'hidden',
          width: '100%',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(0, 217, 255, 0.05)',
            borderBottom: '1px solid rgba(0, 217, 255, 0.15)',
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#00d9ff',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              {block.title}
            </span>
            <button
              onClick={() => handleCopy(block.content, idx)}
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(0, 217, 255, 0.5)',
                background: copiedIndex === idx ? '#00d9ff' : 'transparent',
                color: copiedIndex === idx ? '#0a0e27' : '#00d9ff',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.3px',
              }}
            >
              {copiedIndex === idx ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
          <div style={{
            padding: '16px',
            fontSize: contentType === 'videos' ? '13px' : '14px',
            lineHeight: '1.7',
            color: '#cbd5e1',
            fontFamily: contentType === 'videos' ? 'monospace' : 'inherit',
            overflowX: 'auto',
            whiteSpace: contentType === 'videos' ? 'pre-wrap' : 'normal',
          }}>
            {contentType === 'videos'
              ? formatJson(block.content).split('\n').map((line, i) => {
                  const match = line.match(/^(\s*)"([^"]+)":\s*(.+)$/);
                  if (match) {
                    return (
                      <div key={i}>
                        <span style={{ color: '#64748b' }}>{match[1]}</span>
                        <span style={{ color: '#00d9ff' }}>"{match[2]}"</span>
                        <span style={{ color: '#64748b' }}>: </span>
                        <span style={{ color: '#e2e8f0' }}>{match[3]}</span>
                      </div>
                    );
                  }
                  return <div key={i} style={{ color: '#64748b' }}>{line}</div>;
                })
              : block.content.split('\n').map((line, i) =>
                  line.trim() ? (
                    <p key={i} style={{ margin: '4px 0', color: line.match(/CENA\s+\d+/i) ? '#00d9ff' : '#cbd5e1', fontWeight: line.match(/CENA\s+\d+/i) ? 600 : 400 }}>
                      {line}
                    </p>
                  ) : <br key={i} />
                )
            }
          </div>
        </div>
      ))}
    </div>
  );
}
