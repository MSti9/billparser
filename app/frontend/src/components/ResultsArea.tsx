import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BillSegment, BillStats } from '@/lib/api';
import { COPY_INSTRUCTIONS_HEADER } from '@/lib/demo-data';
import { toast } from 'sonner';
import { Copy, Sparkles, Plus, Minus, Eye, FileCode, Bot } from 'lucide-react';
import VisualDiff from './VisualDiff';
import TaggedText from './TaggedText';
import AIAnalysis from './AIAnalysis';

interface ResultsAreaProps {
  segments: BillSegment[];
  taggedText: string;
  stats: BillStats;
  onAnalyze: () => void;
  analysis: string;
  isAnalyzing: boolean;
  analysisError: string | null;
}

export default function ResultsArea({
  segments,
  taggedText,
  stats,
  onAnalyze,
  analysis,
  isAnalyzing,
  analysisError,
}: ResultsAreaProps) {
  const [activeTab, setActiveTab] = useState('visual');

  const handleCopy = async () => {
    try {
      const textToCopy = COPY_INSTRUCTIONS_HEADER + taggedText;
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Tagged text copied with AI instructions');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bill-card flex items-center gap-3 !p-4">
          <div className="w-10 h-10 rounded bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-[#22c55e]" />
          </div>
          <div>
            <p className="text-[#22c55e] font-mono text-lg font-bold leading-none">
              {stats.new_count}
            </p>
            <p className="text-[#3d506e] font-mono text-xs mt-1">
              new provisions ({stats.new_words.toLocaleString()} words)
            </p>
          </div>
        </div>
        <div className="bill-card flex items-center gap-3 !p-4">
          <div className="w-10 h-10 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Minus className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div>
            <p className="text-[#ef4444] font-mono text-lg font-bold leading-none">
              {stats.deleted_count}
            </p>
            <p className="text-[#3d506e] font-mono text-xs mt-1">
              deleted provisions ({stats.deleted_words.toLocaleString()} words)
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleCopy}
          variant="outline"
          className="border-[#1c2a48] text-[#7a8eaf] hover:bg-[#1c2a48] hover:text-[#c8d3e6] font-mono text-sm"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy for Any AI
        </Button>
        <Button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="bg-[#2952cc] hover:bg-[#3563dd] text-white font-mono text-sm"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analyze with Claude
        </Button>
      </div>

      {/* View Tabs */}
      <div className="bill-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0a0f1a] border border-[#1c2a48] w-full justify-start">
            <TabsTrigger
              value="visual"
              className="data-[state=active]:bg-[#1c2a48] data-[state=active]:text-[#c8d3e6] text-[#3d506e] font-mono text-sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Visual Diff
            </TabsTrigger>
            <TabsTrigger
              value="tagged"
              className="data-[state=active]:bg-[#1c2a48] data-[state=active]:text-[#c8d3e6] text-[#3d506e] font-mono text-sm"
            >
              <FileCode className="w-4 h-4 mr-2" />
              Tagged Text
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-[#1c2a48] data-[state=active]:text-[#c8d3e6] text-[#3d506e] font-mono text-sm"
            >
              <Bot className="w-4 h-4 mr-2" />
              AI Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="mt-4">
            <VisualDiff segments={segments} />
          </TabsContent>

          <TabsContent value="tagged" className="mt-4">
            <TaggedText taggedText={taggedText} />
          </TabsContent>

          <TabsContent value="analysis" className="mt-4">
            <AIAnalysis
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              error={analysisError}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
