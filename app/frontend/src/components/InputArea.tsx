import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Globe, Code, Play, FileText } from 'lucide-react';
import { DEMO_HTML } from '@/lib/demo-data';

interface InputAreaProps {
  onParseBill: (html: string) => void;
  onFetchAndParse: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function InputArea({ onParseBill, onFetchAndParse, isLoading, error }: InputAreaProps) {
  const [url, setUrl] = useState('');
  const [htmlSource, setHtmlSource] = useState('');
  const [activeTab, setActiveTab] = useState('url');

  const handleParse = () => {
    if (activeTab === 'url') {
      if (url.trim()) onFetchAndParse(url.trim());
    } else {
      if (htmlSource.trim()) onParseBill(htmlSource.trim());
    }
  };

  const handleLoadDemo = () => {
    setHtmlSource(DEMO_HTML);
    setActiveTab('html');
  };

  const canParse = activeTab === 'url' ? url.trim().length > 0 : htmlSource.trim().length > 0;

  return (
    <div className="bill-card">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#0a0f1a] border border-[#1c2a48] w-full justify-start">
          <TabsTrigger
            value="url"
            className="data-[state=active]:bg-[#1c2a48] data-[state=active]:text-[#c8d3e6] text-[#3d506e] font-mono text-sm"
          >
            <Globe className="w-4 h-4 mr-2" />
            Paste URL
          </TabsTrigger>
          <TabsTrigger
            value="html"
            className="data-[state=active]:bg-[#1c2a48] data-[state=active]:text-[#c8d3e6] text-[#3d506e] font-mono text-sm"
          >
            <Code className="w-4 h-4 mr-2" />
            Paste HTML Source
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-4">
          <div className="space-y-3">
            <Input
              placeholder="https://www.ilga.gov/legislation/fulltext.asp?..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-[#080c15] border-[#1c2a48] text-[#c8d3e6] placeholder:text-[#3d506e] font-mono text-sm h-12"
            />
            <p className="text-[#3d506e] text-xs font-mono">
              Paste the URL to any bill's .htm full text on ILGA.gov
            </p>
          </div>
        </TabsContent>

        <TabsContent value="html" className="mt-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Paste raw HTML source code here..."
              value={htmlSource}
              onChange={(e) => setHtmlSource(e.target.value)}
              className="bg-[#080c15] border-[#1c2a48] text-[#c8d3e6] placeholder:text-[#3d506e] font-mono text-sm min-h-[200px] resize-y"
            />
            <p className="text-[#3d506e] text-xs font-mono">
              Open any bill on ILGA.gov &rarr; Right-click &rarr; View Page Source &rarr; Select All &rarr; Copy &rarr; Paste here
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-5">
        <Button
          onClick={handleParse}
          disabled={!canParse || isLoading}
          className="bg-[#2952cc] hover:bg-[#3563dd] text-white font-mono text-sm px-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Parsing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Parse Bill
            </>
          )}
        </Button>
        <Button
          onClick={handleLoadDemo}
          variant="outline"
          className="border-[#1c2a48] text-[#7a8eaf] hover:bg-[#1c2a48] hover:text-[#c8d3e6] font-mono text-sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          Load Demo
        </Button>
      </div>
    </div>
  );
}
