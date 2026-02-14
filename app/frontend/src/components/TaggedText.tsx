import React from 'react';

interface TaggedTextProps {
  taggedText: string;
}

export default function TaggedText({ taggedText }: TaggedTextProps) {
  const renderTaggedText = (text: string) => {
    const parts: JSX.Element[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Find [NEW] or [DELETED] tags
      const newStart = remaining.indexOf('[NEW]');
      const delStart = remaining.indexOf('[DELETED]');

      let nextTagStart = -1;
      let tagType: 'new' | 'deleted' | null = null;

      if (newStart >= 0 && (delStart < 0 || newStart < delStart)) {
        nextTagStart = newStart;
        tagType = 'new';
      } else if (delStart >= 0) {
        nextTagStart = delStart;
        tagType = 'deleted';
      }

      if (nextTagStart < 0) {
        // No more tags, push the rest as plain text
        parts.push(<span key={key++} className="text-[#7a8eaf]">{remaining}</span>);
        break;
      }

      // Push text before the tag
      if (nextTagStart > 0) {
        parts.push(<span key={key++} className="text-[#7a8eaf]">{remaining.slice(0, nextTagStart)}</span>);
      }

      if (tagType === 'new') {
        const endTag = remaining.indexOf('[/NEW]', nextTagStart);
        if (endTag >= 0) {
          const openTag = '[NEW]';
          const closeTag = '[/NEW]';
          const content = remaining.slice(nextTagStart + openTag.length, endTag);
          parts.push(
            <span key={key++}>
              <span className="text-[#22c55e] font-bold">[NEW]</span>
              <span className="text-[#c8d3e6]">{content}</span>
              <span className="text-[#22c55e] font-bold">[/NEW]</span>
            </span>
          );
          remaining = remaining.slice(endTag + closeTag.length);
        } else {
          parts.push(<span key={key++} className="text-[#7a8eaf]">{remaining}</span>);
          break;
        }
      } else if (tagType === 'deleted') {
        const endTag = remaining.indexOf('[/DELETED]', nextTagStart);
        if (endTag >= 0) {
          const openTag = '[DELETED]';
          const closeTag = '[/DELETED]';
          const content = remaining.slice(nextTagStart + openTag.length, endTag);
          parts.push(
            <span key={key++}>
              <span className="text-[#ef4444] font-bold">[DELETED]</span>
              <span className="text-[#c8d3e6]">{content}</span>
              <span className="text-[#ef4444] font-bold">[/DELETED]</span>
            </span>
          );
          remaining = remaining.slice(endTag + closeTag.length);
        } else {
          parts.push(<span key={key++} className="text-[#7a8eaf]">{remaining}</span>);
          break;
        }
      }
    }

    return parts;
  };

  return (
    <div>
      <p className="text-[#3d506e] text-xs font-mono mb-4">
        This is what gets sent to AI — your formatting preserved as semantic tags
      </p>
      <div className="p-6 bg-[#080c15] rounded border border-[#1c2a48] font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-auto max-h-[600px]">
        {renderTaggedText(taggedText)}
      </div>
    </div>
  );
}
