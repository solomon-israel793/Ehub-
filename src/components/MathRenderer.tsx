import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  block?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', block = false }) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // If block is specified directly, try full block render
    if (block && !content.includes('$')) {
      try {
        return katex.renderToString(content, { displayMode: true, throwOnError: false });
      } catch {
        return content;
      }
    }

    // Process mixed markdown/text with $inline$ and $$block$$
    try {
      // Replace block math $$...$$ first
      let result = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return `$$${math}$$`;
        }
      });

      // Replace inline math $...$
      result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `$${math}$`;
        }
      });

      return result;
    } catch {
      return content;
    }
  }, [content, block]);

  return (
    <span
      className={`math-rendered ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
