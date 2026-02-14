import { Loader2 } from 'lucide-react';

interface AIAnalysisProps {
  analysis: string;
  isAnalyzing: boolean;
  error: string | null;
}

export default function AIAnalysis({ analysis, isAnalyzing, error }: AIAnalysisProps) {
  if (error) {
    return (
      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded">
        <p className="text-red-400 text-sm mb-2">{error}</p>
        <p className="text-[#3d506e] text-xs font-mono">
          Use the "Copy for Any AI" button to paste the tagged text into any AI chat.
        </p>
      </div>
    );
  }

  if (isAnalyzing && !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#2952cc] animate-spin mb-4" />
        <p className="text-[#7a8eaf] font-mono text-sm animate-pulse">
          Analyzing legislative changes...
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[#3d506e] font-mono text-sm">
          Click "Analyze with Claude" to get AI analysis
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#080c15] rounded border border-[#1c2a48]">
      <div className="prose prose-invert max-w-none text-[#c8d3e6] text-sm leading-relaxed whitespace-pre-wrap">
        {analysis}
      </div>
      {isAnalyzing && (
        <div className="mt-2 flex items-center gap-2">
          <Loader2 className="w-3 h-3 text-[#2952cc] animate-spin" />
          <span className="text-[#3d506e] text-xs font-mono">Still receiving...</span>
        </div>
      )}
    </div>
  );
}
