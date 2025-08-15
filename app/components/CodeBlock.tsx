'use client';

import React, { useMemo } from 'react';
import Prism from 'prismjs';

// Import Python syntax highlighting
import 'prismjs/components/prism-python';

interface CodeBlockProps {
  code: string;
  language?: string;
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'python',
  backgroundColor = '#f8f9fa',
  borderColor = '#dee2e6',
  className = '',
  style = {}
}) => {
  const highlightedLines = useMemo(() => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const highlighted = line 
        ? Prism.highlight(line, Prism.languages[language] || Prism.languages.plain || {}, language)
        : ' ';
      
      return {
        lineNumber: index + 1,
        content: highlighted
      };
    });
  }, [code, language]);

  const defaultStyle: React.CSSProperties = {
    backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    padding: '0',
    marginBottom: '16px',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    overflow: 'auto',
    ...style
  };

  // Simple syntax highlighting colors for Python
  const syntaxStyles = `
    .token.keyword { color: #0000ff; font-weight: bold; }
    .token.string { color: #008000; }
    .token.number { color: #ff6600; }
    .token.operator { color: #000000; }
    .token.comment { color: #808080; font-style: italic; }
    .token.punctuation { color: #000000; }
    .token.function { color: #795da3; }
    .token.builtin { color: #0086b3; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: syntaxStyles }} />
      <div style={defaultStyle} className={className}>
        <pre style={{ margin: '0', padding: '0', backgroundColor: 'transparent' }}>
          <code style={{ display: 'block', padding: '0' }}>
            {highlightedLines.map((line, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  minHeight: '1.5em',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    minWidth: '3em',
                    padding: '0 12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: '#666',
                    fontSize: '0.75em',
                    textAlign: 'right',
                    borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                    userSelect: 'none',
                    lineHeight: '1.5em'
                  }}
                >
                  {line.lineNumber}
                </span>
                <span
                  style={{
                    flex: 1,
                    padding: '0 12px',
                    whiteSpace: 'pre',
                    lineHeight: '1.5em'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: line.content
                  }}
                />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </>
  );
};

export default CodeBlock;