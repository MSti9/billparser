import { BillSegment } from '@/lib/api';

interface VisualDiffProps {
  segments: BillSegment[];
}

export default function VisualDiff({ segments }: VisualDiffProps) {
  return (
    <div>
      <div className="flex items-center gap-6 mb-4 text-xs font-mono text-[#7a8eaf]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(34,197,94,0.15)] border border-green-500/30" />
          <span>NEW language (added)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-[rgba(239,68,68,0.12)] border border-red-500/30" />
          <span>DELETED language (removed)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#0c1221] border border-[#1c2a48]" />
          <span>Unchanged</span>
        </div>
      </div>

      <div className="bill-text-display p-6 bg-[#080c15] rounded border border-[#1c2a48]">
        {segments.map((segment, index) => {
          if (segment.type === 'new') {
            return (
              <span
                key={index}
                className="text-[#22c55e] underline decoration-[#22c55e]/50"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.07)' }}
              >
                {segment.text}
              </span>
            );
          }
          if (segment.type === 'deleted') {
            return (
              <span
                key={index}
                className="text-[#ef4444] line-through opacity-80"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.06)' }}
              >
                {segment.text}
              </span>
            );
          }
          return (
            <span key={index} className="text-[#7a8eaf]">
              {segment.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
