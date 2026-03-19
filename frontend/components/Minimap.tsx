'use client';

import { useEffect, useRef } from 'react';
import type { GraphNode, GraphEdge, NodeType } from '@/lib/types';

const NODE_COLORS: Record<NodeType, string> = {
  File:     '#00d4a0',
  Class:    '#a78bfa',
  Function: '#38bdf8',
  Module:   '#fb923c',
};

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const W = 160;
const H = 100;
const PAD = 6;

export default function Minimap({ nodes, edges }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Read actual Cytoscape positions from the DOM via the cy container
    // Fallback: use random stable positions seeded by node index
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const r = 0.35 + (i % 3) * 0.1;
      positions[n.id] = {
        x: 0.5 + r * Math.cos(angle),
        y: 0.5 + r * Math.sin(angle),
      };
    });

    // Try to read real positions from cytoscape instance via window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cy = (window as any)._cyInstance as any;
    if (cy) {
      const ext = cy.extent();
      const rangeX = (ext.x2 - ext.x1) || 1;
      const rangeY = (ext.y2 - ext.y1) || 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.nodes().forEach((n: any) => {
        const pos = n.position();
        positions[n.id()] = {
          x: (pos.x - ext.x1) / rangeX,
          y: (pos.y - ext.y1) / rangeY,
        };
      });
    }

    // Draw
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Edges
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 0.5;
    edges.slice(0, 200).forEach((e) => {
      const a = positions[e.source];
      const b = positions[e.target];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(PAD + a.x * (W - PAD * 2), PAD + a.y * (H - PAD * 2));
      ctx.lineTo(PAD + b.x * (W - PAD * 2), PAD + b.y * (H - PAD * 2));
      ctx.stroke();
    });

    // Nodes
    nodes.forEach((n) => {
      const p = positions[n.id];
      if (!p) return;
      const x = PAD + p.x * (W - PAD * 2);
      const y = PAD + p.y * (H - PAD * 2);
      ctx.fillStyle = NODE_COLORS[n.type as NodeType] || '#8888aa';
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [nodes, edges]);

  if (nodes.length === 0) return null;

  return (
    <div
      className="absolute bottom-14 left-3 z-20 rounded overflow-hidden border border-[#2a2a3a] shadow-xl"
      style={{ background: '#0a0a0f', opacity: 0.85 }}
      title="Minimap"
    >
      <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block' }} />
    </div>
  );
}
