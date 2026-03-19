'use client';

import { useState } from 'react';
import { ExternalLink, Share2, Download, ChevronDown, Plus, Check, Menu, MoreHorizontal } from 'lucide-react';
import { useGraphStore } from '@/lib/store';

const LAYOUTS = ['fcose', 'cose', 'breadthfirst', 'concentric'] as const;

interface Props {
  onMenuClick?: () => void;
}

export default function StatsBar({ onMenuClick }: Props) {
  const { nodes, edges, repoUrl, layout, setLayout } = useGraphStore();
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const repoName = repoUrl ? repoUrl.replace('https://github.com/', '') : 'Unknown repo';
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
    <header className="h-11 flex items-center justify-between px-3 md:px-4 border-b border-[#2a2a3a] bg-[#0a0a0f] flex-shrink-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button onClick={onMenuClick} className="md:hidden flex-shrink-0 w-7 h-7 flex items-center justify-center text-[#8888aa] hover:text-[#f0f0ff]">
          <Menu size={16} />
        </button>
        <span className="font-mono font-bold text-sm text-[#f0f0ff] flex-shrink-0">
          Code<span className="text-[#5b4dff]">Graph</span>
        </span>
        {repoUrl && (
          <>
            <span className="text-[#2a2a3a] hidden sm:inline">·</span>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs text-[#8888aa] hover:text-[#f0f0ff] font-mono truncate max-w-[160px]">
              {repoName}<ExternalLink size={11} className="flex-shrink-0" />
            </a>
          </>
        )}
        <span className="text-[#2a2a3a]">·</span>
        <span className="text-xs text-[#8888aa] font-mono whitespace-nowrap">
          {nodes.length.toLocaleString()} <span className="hidden sm:inline">nodes</span>
        </span>
        <span className="text-[#2a2a3a] hidden sm:inline">·</span>
        <span className="hidden sm:inline text-xs text-[#8888aa] font-mono">
          {edges.length.toLocaleString()} edges
        </span>
        {languages.length > 0 && (
          <span className="hidden lg:inline text-xs text-[#8888aa] font-mono">· {languages.join(', ')}</span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Desktop: layout picker */}
        <div className="relative hidden sm:block">
          <button onClick={() => { setLayoutOpen(o => !o); setMoreOpen(false); }}
            className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-mono border border-[#2a2a3a] bg-[#111118] text-[#8888aa] hover:text-[#f0f0ff] hover:border-[#5b4dff] transition-colors">
            Layout: {layout}<ChevronDown size={12} />
          </button>
          {layoutOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#111118] border border-[#2a2a3a] rounded shadow-xl z-30 min-w-[140px]">
              {LAYOUTS.map(l => (
                <button key={l} onClick={() => { setLayout(l); setLayoutOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#1a1a24] transition-colors ${l === layout ? 'text-[#5b4dff]' : 'text-[#8888aa]'}`}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: export */}
        <button onClick={handleExport}
          className="hidden md:flex items-center gap-1.5 px-3 h-7 rounded text-xs font-mono border border-[#2a2a3a] bg-[#111118] text-[#8888aa] hover:text-[#f0f0ff] transition-colors">
          <Download size={12} />Export JSON
        </button>

        {/* Share */}
        <button onClick={handleShare}
          className={`flex items-center gap-1.5 px-2 md:px-3 h-7 rounded text-xs font-mono border transition-colors ${copied ? 'border-[#00d4a0] text-[#00d4a0] bg-[#00d4a010]' : 'border-[#2a2a3a] bg-[#111118] text-[#8888aa] hover:text-[#f0f0ff]'}`}>
          <Check size={12} className={copied ? '' : 'hidden'} />
          <Share2 size={12} className={copied ? 'hidden' : ''} />
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
        </button>

        {/* Mobile: ··· overflow menu (layout + export) */}
        <div className="relative sm:hidden">
          <button onClick={() => { setMoreOpen(o => !o); setLayoutOpen(false); }}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#2a2a3a] bg-[#111118] text-[#8888aa] hover:text-[#f0f0ff] transition-colors">
            <MoreHorizontal size={14} />
          </button>
          {moreOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#111118] border border-[#2a2a3a] rounded shadow-xl z-50 min-w-[160px]">
              <div className="px-3 py-1.5 text-[10px] font-mono text-[#44445a] uppercase tracking-widest">Layout</div>
              {LAYOUTS.map(l => (
                <button key={l} onClick={() => { setLayout(l); setMoreOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#1a1a24] transition-colors ${l === layout ? 'text-[#5b4dff]' : 'text-[#8888aa]'}`}>
                  {l === layout ? '✓ ' : '  '}{l}
                </button>
              ))}
              <div className="border-t border-[#2a2a3a] mt-1">
                <button onClick={() => { handleExport(); setMoreOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-[#8888aa] hover:bg-[#1a1a24] hover:text-[#f0f0ff] flex items-center gap-2">
                  <Download size={12} />Export JSON
                </button>
              </div>
            </div>
          )}
        </div>

        {/* New repo */}
        <a href="/" className="flex items-center gap-1 px-2 md:px-3 h-7 rounded text-xs font-semibold bg-[#5b4dff] hover:bg-[#7060ff] text-white transition-colors">
          <Plus size={12} /><span className="hidden sm:inline">New repo</span>
        </a>
      </div>
    </header>
  );
}
