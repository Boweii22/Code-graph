'use client';

import { useState } from 'react';
import { ExternalLink, Share2, Download, ChevronDown, Plus, Check } from 'lucide-react';
import { useGraphStore } from '@/lib/store';

const LAYOUTS = ['fcose', 'cose', 'breadthfirst', 'concentric'] as const;

export default function StatsBar() {
  const { nodes, edges, repoUrl, layout, setLayout } = useGraphStore();
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const repoName = repoUrl
    ? repoUrl.replace('https://github.com/', '')
    : 'Unknown repo';

  const languages = [...new Set(nodes.map((n) => n.language).filter(Boolean))] as string[];

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codegraph-${repoName.replace('/', '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="h-11 flex items-center justify-between px-4 border-b border-[#2a2a3a] bg-[#0a0a0f] flex-shrink-0 z-10">
      {/* Left: logo + repo info */}
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-sm text-[#f0f0ff]">CodeGraph</span>
        <span className="text-[#2a2a3a]">·</span>
        {repoUrl ? (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[#8888aa] hover:text-[#f0f0ff] transition-colors font-mono"
          >
            {repoName}
            <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-sm text-[#44445a] font-mono">—</span>
        )}
        <span className="text-[#2a2a3a]">·</span>
        <span className="text-xs text-[#8888aa] font-mono">
          {nodes.length.toLocaleString()} nodes
        </span>
        <span className="text-[#2a2a3a]">·</span>
        <span className="text-xs text-[#8888aa] font-mono">
          {edges.length.toLocaleString()} edges
        </span>
        {languages.length > 0 && (
          <>
            <span className="text-[#2a2a3a]">·</span>
            <span className="text-xs text-[#8888aa] font-mono">{languages.join(', ')}</span>
          </>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Layout picker */}
        <div className="relative">
          <button
            onClick={() => setLayoutOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-mono border border-[#2a2a3a] bg-[#111118] text-[#8888aa] hover:text-[#f0f0ff] hover:border-[#5b4dff] transition-colors"
          >
            Layout: {layout}
            <ChevronDown size={12} />
          </button>
          {layoutOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#111118] border border-[#2a2a3a] rounded shadow-xl z-30 min-w-[140px]">
              {LAYOUTS.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLayout(l);
                    setLayoutOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#1a1a24] transition-colors ${
                    l === layout ? 'text-[#5b4dff]' : 'text-[#8888aa]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-mono border border-[#2a2a3a] bg-[#111118] text-[#8888aa] hover:text-[#f0f0ff] transition-colors"
        >
          <Download size={12} />
          Export JSON
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className={`flex items-center gap-1.5 px-3 h-7 rounded text-xs font-mono border transition-colors ${
            copied
              ? 'border-[#00d4a0] text-[#00d4a0] bg-[#00d4a010]'
              : 'border-[#2a2a3a] bg-[#111118] text-[#8888aa] hover:text-[#f0f0ff]'
          }`}
        >
          {copied ? <Check size={12} /> : <Share2 size={12} />}
          {copied ? 'Copied!' : 'Share'}
        </button>

        {/* New repo */}
        <a
          href="/"
          className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-semibold bg-[#5b4dff] hover:bg-[#7060ff] text-white transition-colors"
        >
          <Plus size={12} />
          New repo
        </a>
      </div>
    </header>
  );
}
