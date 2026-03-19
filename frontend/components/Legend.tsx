'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useGraphStore } from '@/lib/store';
import type { GraphNode, NodeType } from '@/lib/types';

const NODE_TYPES: { type: NodeType; color: string; icon: string; shape: string }[] = [
  { type: 'File',     color: '#00d4a0', icon: '▪', shape: 'rect' },
  { type: 'Class',    color: '#a78bfa', icon: '◆', shape: 'diamond' },
  { type: 'Function', color: '#38bdf8', icon: '●', shape: 'circle' },
  { type: 'Module',   color: '#fb923c', icon: '⬡', shape: 'hexagon' },
];

const EDGE_TYPES = [
  { type: 'CALLS',        color: '#38bdf8' },
  { type: 'IMPORTS',      color: '#fb923c' },
  { type: 'DEFINED_IN',   color: '#00d4a0' },
  { type: 'BELONGS_TO',   color: '#a78bfa' },
  { type: 'DEPENDS_ON',   color: '#6b7280' },
  { type: 'INHERITS_FROM',color: '#f472b6' },
];

export default function Legend() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const hiddenTypes = useGraphStore((s) => s.hiddenTypes);
  const toggleType = useGraphStore((s) => s.toggleType);
  const filterStr = useGraphStore((s) => s.filterStr);
  const setFilter = useGraphStore((s) => s.setFilter);
  const selectNode = useGraphStore((s) => s.selectNode);

  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);
  const [showResults, setShowResults] = useState(false);

  const stats = {
    nodes: nodes.length,
    edges: edges.length,
    files: nodes.filter((n) => n.type === 'File').length,
    functions: nodes.filter((n) => n.type === 'Function').length,
    classes: nodes.filter((n) => n.type === 'Class').length,
    modules: nodes.filter((n) => n.type === 'Module').length,
    languages: [...new Set(nodes.map((n) => n.language).filter(Boolean))],
  };

  const handleSearch = (val: string) => {
    setFilter(val);
    if (val.length > 1) {
      const lower = val.toLowerCase();
      const results = nodes
        .filter((n) => n.label.toLowerCase().includes(lower))
        .slice(0, 8);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col gap-0 overflow-y-auto border-r border-[#2a2a3a] bg-[#0a0a0f]">
      {/* Node types */}
      <div className="p-3 border-b border-[#2a2a3a]">
        <h3 className="text-[10px] font-mono text-[#44445a] uppercase tracking-widest mb-2">
          Node Types
        </h3>
        {NODE_TYPES.map(({ type, color, icon }) => {
          const hidden = hiddenTypes.has(type);
          const count = nodes.filter((n) => n.type === type).length;
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#1a1a24] transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span style={{ color: hidden ? '#44445a' : color }} className="text-sm leading-none">
                  {icon}
                </span>
                <span
                  className={`text-xs font-mono transition-colors ${
                    hidden ? 'text-[#44445a] line-through' : 'text-[#f0f0ff]'
                  }`}
                >
                  {type}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#44445a]">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#2a2a3a]">
        <h3 className="text-[10px] font-mono text-[#44445a] uppercase tracking-widest mb-2">
          Search
        </h3>
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#44445a]" />
          <input
            type="text"
            value={filterStr}
            onChange={(e) => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Search nodes…"
            className="w-full h-7 pl-6 pr-2 rounded bg-[#111118] border border-[#2a2a3a] text-xs text-[#f0f0ff] placeholder-[#44445a] font-mono focus:outline-none focus:border-[#5b4dff]"
          />
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#111118] border border-[#2a2a3a] rounded z-30 overflow-hidden shadow-xl">
              {searchResults.map((n) => (
                <button
                  key={n.id}
                  onMouseDown={() => {
                    selectNode(n);
                    setShowResults(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#1a1a24] transition-colors"
                >
                  <p className="text-xs font-mono text-[#f0f0ff] truncate">{n.label}</p>
                  <p className="text-[10px] text-[#44445a]">{n.type}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 border-b border-[#2a2a3a]">
        <h3 className="text-[10px] font-mono text-[#44445a] uppercase tracking-widest mb-2">
          Stats
        </h3>
        <div className="space-y-1">
          {[
            { label: 'Nodes', value: stats.nodes },
            { label: 'Edges', value: stats.edges },
            { label: 'Files', value: stats.files },
            { label: 'Functions', value: stats.functions },
            { label: 'Classes', value: stats.classes },
            { label: 'Ext modules', value: stats.modules },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-[#8888aa]">{label}</span>
              <span className="font-mono text-[#f0f0ff]">{value}</span>
            </div>
          ))}
          {stats.languages.length > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-[#8888aa]">Languages</span>
              <span className="font-mono text-[#f0f0ff] text-right">
                {(stats.languages as string[]).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Edge types */}
      <div className="p-3">
        <h3 className="text-[10px] font-mono text-[#44445a] uppercase tracking-widest mb-2">
          Edge Types
        </h3>
        <div className="space-y-1.5">
          {EDGE_TYPES.map(({ type, color }) => (
            <div key={type} className="flex items-center gap-2">
              <div className="h-px w-5 flex-shrink-0" style={{ background: color }} />
              <span className="text-[10px] font-mono text-[#8888aa]">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
