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

  const formatJsonContent = (jsonStr: string): string => {
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  };

  const renderJsonLine = (line: string): React.ReactNode => {
    const match = line.match(/^(\s*)"([^"]+)":\s*(.+)$/);
    if (match) {
      const [, indent, key, value] = match;
      return (
        <span>
          <span style={{ color: '#a0aac0' }}>{indent}</span>
          <span style={{ color: '#00d9ff' }}>"{key}"</span>
          <span style={{ color: '#a0aac0' }}>: </span>
          <span style={{ color: '#e0e6ff' }}>{value}</span>
        </span>
      );
    }
    return line;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {blocks.map((block, idx) => {
        const isJson = contentType === 'videos';
        const formattedContent = isJson ? formatJsonContent(block.content) : block.content;

        return (
          <div
            key={idx}
            style={{
              background: isJson ? 'rgba(10,14,39,0.8)' : 'rgba(10,14,39,0.6)',
              border: '1px solid rgba(0,217,255,0.25)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(0,217,255,0.15)',
              }}
            >
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#00d9ff',
                  margin: 0,
                  letterSpacing: '0.5px',
                }}
              >
                {block.title}
              </h2>
              <button
                onClick={() => handleCopy(block.content, idx)}
                onMouseEnter={(e) => {
                  if (copiedIndex !== idx) {
                    e.currentTarget.style.background = '#00d9ff';
                    e.currentTarget.style.color = '#0a0e27';
                  }
                }}
                onMouseLeave={(e) => {
                  if (copiedIndex !== idx) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#00d9ff';
                  }
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid rgba(0,217,255,0.4)',
                  background: copiedIndex === idx ? '#00d9ff' : 'transparent',
                  color: copiedIndex === idx ? '#0a0e27' : '#00d9ff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out',
                }}
              >
                {copiedIndex === idx ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                padding: '20px',
                fontSize: isJson ? '13px' : '15px',
                lineHeight: isJson ? '1.6' : '1.8',
                color: '#e0e6ff',
                fontFamily: isJson ? 'monospace' : 'inherit',
                overflowX: 'auto',
              }}
            >
              {isJson ? (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                  {formattedContent.split('\n').map((line, lineIdx) => (
                    <div key={lineIdx} style={{ color: '#e0e6ff' }}>
                      {renderJsonLine(line)}
                    </div>
                  ))}
                </pre>
              ) : (
                formattedContent.split('\n').map((line, lineIdx) =>
                  line.trim() && (
                    <p key={lineIdx} style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>
                      {line}
                    </p>
                  )
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
