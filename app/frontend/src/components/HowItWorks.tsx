import { Globe, Search, Eye, Copy } from 'lucide-react';

const steps = [
  {
    icon: Globe,
    title: 'Paste a bill URL or HTML',
    description: 'From ILGA.gov. The .htm full text versions work best.',
  },
  {
    icon: Search,
    title: 'Parser detects formatting',
    description: '<u> and <ins> tags = new language. <del>, <s>, <strike> = deleted.',
  },
  {
    icon: Eye,
    title: 'Visual Diff shows changes',
    description: 'Color-coded view. Tagged Text wraps them in [NEW] and [DELETED] markers.',
  },
  {
    icon: Copy,
    title: 'Copy into any AI',
    description: 'Claude, ChatGPT, Gemini — it finally understands what the bill actually changes.',
  },
];

export default function HowItWorks() {
  return (
    <div className="bill-card">
      <h2 className="text-[#7a8eaf] font-mono text-xs uppercase tracking-widest mb-6">
        How It Works
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-3 p-4 bg-[#080c15] rounded border border-[#1c2a48]/50">
            <div className="flex-shrink-0 w-8 h-8 rounded bg-[#2952cc]/10 flex items-center justify-center">
              <step.icon className="w-4 h-4 text-[#2952cc]" />
            </div>
            <div>
              <p className="text-[#c8d3e6] text-sm font-medium mb-1">{step.title}</p>
              <p className="text-[#3d506e] text-xs">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
