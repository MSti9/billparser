import { useState, useCallback } from 'react';
import { billApi, BillSegment, BillStats } from '@/lib/api';
import InputArea from '@/components/InputArea';
import ResultsArea from '@/components/ResultsArea';
import HowItWorks from '@/components/HowItWorks';

export default function BillParser() {
  // Parsing state
  const [isLoading, setIsLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Results state
  const [segments, setSegments] = useState<BillSegment[]>([]);
  const [taggedText, setTaggedText] = useState('');
  const [stats, setStats] = useState<BillStats | null>(null);
  const [hasResults, setHasResults] = useState(false);

  // Analysis state
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleParseResult = useCallback((result: any) => {
    if (result.success) {
      setSegments(result.segments);
      setTaggedText(result.taggedText);
      setStats(result.stats);
      setHasResults(true);
      setParseError(null);
      // Reset analysis when new bill is parsed
      setAnalysis('');
      setAnalysisError(null);
    } else {
      setParseError(result.error || 'Failed to parse bill');
      setHasResults(false);
    }
  }, []);

  const handleParseBill = useCallback(async (html: string) => {
    setIsLoading(true);
    setParseError(null);
    try {
      const result = await billApi.parseBill(html);
      handleParseResult(result);
    } catch (err: any) {
      setParseError(err.response?.data?.detail || err.message || 'Failed to parse bill');
      setHasResults(false);
    } finally {
      setIsLoading(false);
    }
  }, [handleParseResult]);

  const handleFetchAndParse = useCallback(async (url: string) => {
    setIsLoading(true);
    setParseError(null);
    try {
      // First fetch the HTML
      const fetchResult = await billApi.fetchBill(url);
      if (!fetchResult.success) {
        setParseError(fetchResult.error || 'Failed to fetch bill');
        setHasResults(false);
        return;
      }
      // Then parse it
      const parseResult = await billApi.parseBill(fetchResult.html);
      handleParseResult(parseResult);
    } catch (err: any) {
      setParseError(err.response?.data?.detail || err.message || 'Failed to fetch bill');
      setHasResults(false);
    } finally {
      setIsLoading(false);
    }
  }, [handleParseResult]);

  const handleAnalyze = useCallback(() => {
    setIsAnalyzing(true);
    setAnalysis('');
    setAnalysisError(null);

    billApi.analyzeBill(
      taggedText,
      (chunk) => {
        setAnalysis((prev) => prev + chunk);
      },
      () => {
        setIsAnalyzing(false);
      },
      (error) => {
        setAnalysisError(error);
        setIsAnalyzing(false);
      }
    );
  }, [taggedText]);

  return (
    <div className="min-h-screen bg-[#080c15]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-[#1c2a48] bg-[#080c15]/95 backdrop-blur-sm">
        <div className="max-w-[860px] mx-auto px-6 py-4">
          <h1 className="text-[#c8d3e6] font-mono text-lg font-bold tracking-tight">
            Legislative Bill Parser
          </h1>
          <p className="text-[#3d506e] text-xs font-mono mt-0.5">
            Parse Illinois bill HTML to detect NEW and DELETED language
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[860px] mx-auto px-6 py-8 space-y-6">
        {/* Input Section */}
        <InputArea
          onParseBill={handleParseBill}
          onFetchAndParse={handleFetchAndParse}
          isLoading={isLoading}
          error={parseError}
        />

        {/* Results Section */}
        {hasResults && stats && (
          <ResultsArea
            segments={segments}
            taggedText={taggedText}
            stats={stats}
            onAnalyze={handleAnalyze}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
          />
        )}

        {/* How It Works */}
        <HowItWorks />
      </main>
    </div>
  );
}
