'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { useGraphStore } from '@/lib/store';
import type { GraphNode, NodeType } from '@/lib/types';

const NODE_COLORS: Record<NodeType, string> = {
  File: '#00d4a0',
  Class: '#a78bfa',
  Function: '#38bdf8',
  Module: '#fb923c',
};

const NODE_ICONS: Record<NodeType, string> = {
  File: '▪',
  Class: '◆',
  Function: '●',
  Module: '⬡',
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono border transition-all ${
        copied
          ? 'border-[#00d4a0] text-[#00d4a0] bg-[#00d4a010]'
          : 'border-[#2a2a3a] text-[#8888aa] hover:text-[#f0f0ff] hover:border-[#5b4dff]'
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function buildCypherQuery(node: GraphNode): string {
  return `MATCH (n {id: "${node.id}"})
OPTIONAL MATCH (n)-[r]->(m)
OPTIONAL MATCH (k)-[r2]->(n)
RETURN n, r, m, k, r2`;
}

export default function NodeSidebar() {
  const selectedNode = useGraphStore((s) => s.selectedNode);
  const sidebarOpen = useGraphStore((s) => s.sidebarOpen);
  const selectNode = useGraphStore((s) => s.selectNode);
  const edges = useGraphStore((s) => s.edges);
  const nodes = useGraphStore((s) => s.nodes);

  if (!selectedNode) return null;

  const nodeType = selectedNode.type as NodeType;
  const color = NODE_COLORS[nodeType] || '#8888aa';
  const icon = NODE_ICONS[nodeType] || '●';

  // Find connected nodes
  const outgoing = edges.filter((e) => e.source === selectedNode.id && e.type === 'CALLS');
  const incoming = edges.filter((e) => e.target === selectedNode.id && e.type === 'CALLS');
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          key="node-sidebar"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-[300px] flex-shrink-0 h-full z-20 glass flex flex-col border-l border-[#2a2a3a] overflow-y-auto"
          style={{ borderRadius: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#2a2a3a] sticky top-0 glass z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ color }} className="text-lg leading-none">{icon}</span>
              <div className="min-w-0">
                <p className="font-mono font-semibold text-sm text-[#f0f0ff] truncate">
                  {selectedNode.label}
                </p>
                <p className="text-xs text-[#8888aa]">
                  {selectedNode.type}
                  {selectedNode.file ? ` · ${selectedNode.file.split('/').pop()}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => selectNode(null)}
              className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-[#44445a] hover:text-[#f0f0ff] hover:bg-[#1a1a24] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-4">
            {/* Metadata */}
            <div className="space-y-2">
              {selectedNode.file && (
                <Row label="FILE" value={selectedNode.file} mono />
              )}
              {selectedNode.lineStart && (
                <Row
                  label="LINES"
                  value={`${selectedNode.lineStart} – ${selectedNode.lineEnd ?? '?'}`}
                  mono
                />
              )}
              {selectedNode.language && (
                <Row label="LANGUAGE" value={selectedNode.language} />
              )}
              {selectedNode.calledByCount !== undefined && (
                <Row label="CALLED BY" value={`${selectedNode.calledByCount} functions`} />
              )}
            </div>

            {/* Calls */}
            {outgoing.length > 0 && (
              <div>
                <h4 className="text-xs font-mono text-[#44445a] uppercase tracking-widest mb-2">
                  Calls ({outgoing.length})
                </h4>
                <div className="space-y-1">
                  {outgoing.slice(0, 8).map((e) => {
                    const n = getNode(e.target);
                    return (
                      <button
                        key={e.id}
                        onClick={() => n && selectNode(n)}
                        className="w-full text-left text-xs font-mono px-2 py-1.5 rounded bg-[#1a1a24] hover:bg-[#2a2a3a] text-[#38bdf8] transition-colors flex items-center gap-1.5"
                      >
                        <span className="text-[#44445a]">→</span>
                        {n?.label ?? e.target.split('_').slice(1, 3).join('_')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Called by */}
            {incoming.length > 0 && (
              <div>
                <h4 className="text-xs font-mono text-[#44445a] uppercase tracking-widest mb-2">
                  Called by ({incoming.length})
                </h4>
                <div className="space-y-1">
                  {incoming.slice(0, 8).map((e) => {
                    const n = getNode(e.source);
                    return (
                      <button
                        key={e.id}
                        onClick={() => n && selectNode(n)}
                        className="w-full text-left text-xs font-mono px-2 py-1.5 rounded bg-[#1a1a24] hover:bg-[#2a2a3a] text-[#a78bfa] transition-colors flex items-center gap-1.5"
                      >
                        <span className="text-[#44445a]">←</span>
                        {n?.label ?? e.source.split('_').slice(1, 3).join('_')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Source preview */}
            {selectedNode.sourcePreview && (
              <div>
                <h4 className="text-xs font-mono text-[#44445a] uppercase tracking-widest mb-2">
                  Source Preview
                </h4>
                <pre className="code-preview text-[10px] max-h-40 overflow-y-auto">
                  {selectedNode.sourcePreview}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <CopyButton
                text={buildCypherQuery(selectedNode)}
                label="Copy Cypher query"
              />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="font-mono text-[#44445a] uppercase tracking-wider flex-shrink-0">{label}</span>
      <span className={`text-[#8888aa] text-right break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
