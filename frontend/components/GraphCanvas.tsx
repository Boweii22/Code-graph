'use client';

import { useEffect, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';
// @ts-expect-error — no types for cytoscape-fcose
import fcose from 'cytoscape-fcose';
import { useGraphStore } from '@/lib/store';
import { subscribeToolbar } from './Toolbar';
import type { GraphNode, GraphEdge } from '@/lib/types';

let fcoseRegistered = false;
if (!fcoseRegistered && typeof window !== 'undefined') {
  cytoscape.use(fcose);
  fcoseRegistered = true;
}

const CYTOSCAPE_STYLES: cytoscape.Stylesheet[] = [
  {
    selector: 'node[type="File"]',
    style: {
      'background-color': '#00d4a0',
      'border-color': '#00d4a040',
      'border-width': 2,
      'label': 'data(shortLabel)',
      'font-family': 'Geist Mono, monospace',
      'font-size': '10px',
      'color': '#f0f0ff',
      'text-valign': 'bottom',
      'text-margin-y': 6,
      'width': 28,
      'height': 28,
      'shape': 'round-rectangle',
    } as cytoscape.Css.Node,
  },
  {
    selector: 'node[type="Class"]',
    style: {
      'background-color': '#a78bfa',
      'width': 24,
      'height': 24,
      'shape': 'diamond',
      'label': 'data(shortLabel)',
      'font-family': 'Geist Mono, monospace',
      'font-size': '10px',
      'color': '#f0f0ff',
      'text-valign': 'bottom',
      'text-margin-y': 6,
    } as cytoscape.Css.Node,
  },
  {
    selector: 'node[type="Function"]',
    style: {
      'background-color': '#38bdf8',
      'width': 18,
      'height': 18,
      'shape': 'ellipse',
      'label': 'data(shortLabel)',
      'font-family': 'Geist Mono, monospace',
      'font-size': '9px',
      'color': '#f0f0ff',
      'text-valign': 'bottom',
      'text-margin-y': 5,
    } as cytoscape.Css.Node,
  },
  {
    selector: 'node[type="Module"]',
    style: {
      'background-color': '#fb923c',
      'width': 20,
      'height': 20,
      'shape': 'hexagon',
      'label': 'data(shortLabel)',
      'font-family': 'Geist Mono, monospace',
      'font-size': '9px',
      'color': '#f0f0ff',
      'text-valign': 'bottom',
      'text-margin-y': 5,
    } as cytoscape.Css.Node,
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 3,
      'border-color': '#5b4dff',
      'border-opacity': 1,
    } as cytoscape.Css.Node,
  },
  {
    selector: 'node.highlighted',
    style: { 'opacity': 1 } as cytoscape.Css.Node,
  },
  {
    selector: 'node.dimmed',
    style: { 'opacity': 0.06 } as cytoscape.Css.Node,
  },
  {
    selector: 'node.hover',
    style: {
      'width': 'mapData(width, 0, 100, 30, 120)',
      'overlay-color': '#5b4dff',
      'overlay-padding': 6,
      'overlay-opacity': 0.15,
    } as cytoscape.Css.Node,
  },
  {
    selector: 'edge',
    style: {
      'width': 1,
      'line-color': '#2a2a3a',
      'target-arrow-color': '#2a2a3a',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.8,
      'curve-style': 'bezier',
      'opacity': 0.6,
    } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge[type="CALLS"]',
    style: {
      'line-color': '#38bdf830',
      'target-arrow-color': '#38bdf8',
      'opacity': 0.7,
    } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge[type="IMPORTS"]',
    style: {
      'line-color': '#fb923c30',
      'target-arrow-color': '#fb923c',
    } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge[type="DEFINED_IN"]',
    style: {
      'line-color': '#00d4a020',
      'target-arrow-color': '#00d4a0',
    } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge[type="BELONGS_TO"]',
    style: {
      'line-color': '#a78bfa20',
      'target-arrow-color': '#a78bfa',
    } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge[type="DEPENDS_ON"]',
    style: {
      'line-color': '#6b728040',
      'target-arrow-color': '#6b7280',
    } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge[type="INHERITS_FROM"]',
    style: {
      'line-color': '#f472b640',
      'target-arrow-color': '#f472b6',
    } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge.highlighted',
    style: { 'opacity': 1, 'width': 2 } as cytoscape.Css.Edge,
  },
  {
    selector: 'edge.dimmed',
    style: { 'opacity': 0.03 } as cytoscape.Css.Edge,
  },
];

const LAYOUT_OPTIONS: Record<string, cytoscape.LayoutOptions> = {
  fcose: {
    name: 'fcose',
    quality: 'proof',
    animate: true,
    animationDuration: 800,
    // @ts-expect-error fcose-specific options
    nodeRepulsion: () => 8500,
    idealEdgeLength: () => 120,
    edgeElasticity: () => 0.45,
    gravity: 0.25,
    gravityRange: 3.8,
  },
  cose: {
    name: 'cose',
    animate: true,
    animationDuration: 600,
    idealEdgeLength: 100,
    nodeRepulsion: () => 400000,
  },
  breadthfirst: {
    name: 'breadthfirst',
    animate: true,
    animationDuration: 600,
    directed: true,
    padding: 30,
  },
  concentric: {
    name: 'concentric',
    animate: true,
    animationDuration: 600,
    minNodeSpacing: 50,
  },
};

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function GraphCanvas({ nodes, edges }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const selectNode = useGraphStore((s) => s.selectNode);
  const setSidebarOpen = useGraphStore((s) => (open: boolean) => s.selectNode(open ? s.selectedNode : null));
  const hiddenTypes = useGraphStore((s) => s.hiddenTypes);
  const filterStr = useGraphStore((s) => s.filterStr);
  const layout = useGraphStore((s) => s.layout);
  const highlightedNodeIds = useGraphStore((s) => s.highlightedNodeIds);

  // Build cytoscape elements from nodes/edges
  const buildElements = useCallback(
    (n: GraphNode[], e: GraphEdge[]) => {
      const cyNodes = n
        .filter((node) => !hiddenTypes.has(node.type))
        .map((node) => ({
          data: { ...node, id: node.id },
        }));

      const nodeIds = new Set(cyNodes.map((n) => n.data.id));
      const cyEdges = e
        .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
        .map((edge) => ({
          data: { ...edge, id: edge.id },
        }));

      return [...cyNodes, ...cyEdges];
    },
    [hiddenTypes]
  );

  // Init cytoscape
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(nodes, edges),
      style: CYTOSCAPE_STYLES,
      layout: LAYOUT_OPTIONS['fcose'],
      minZoom: 0.05,
      maxZoom: 5,
      wheelSensitivity: 0.3,
    });

    cyRef.current = cy;

    // Node click — highlight neighborhood
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = node.data() as GraphNode;
      cy.elements().addClass('dimmed').removeClass('highlighted');
      node.closedNeighborhood().addClass('highlighted').removeClass('dimmed');
      selectNode(nodeData);
    });

    // Background click — clear
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('dimmed highlighted');
        selectNode(null);
      }
    });

    // Node hover glow
    cy.on('mouseover', 'node', (evt) => {
      evt.target.addClass('hover');
    });
    cy.on('mouseout', 'node', (evt) => {
      evt.target.removeClass('hover');
    });

    // Edge hover
    cy.on('mouseover', 'edge', (evt) => {
      evt.target.style({ 'width': 3, 'opacity': 1 });
      evt.target.source().style({ 'overlay-opacity': 0.1 });
      evt.target.target().style({ 'overlay-opacity': 0.1 });
    });
    cy.on('mouseout', 'edge', (evt) => {
      evt.target.style({ 'width': '', 'opacity': '' });
      evt.target.source().style({ 'overlay-opacity': '' });
      evt.target.target().style({ 'overlay-opacity': '' });
    });

    // Toolbar zoom/fit controls
    const unsubZoomIn  = subscribeToolbar('zoom-in',  () => cy.animate({ zoom: cy.zoom() * 1.3, duration: 200 }));
    const unsubZoomOut = subscribeToolbar('zoom-out', () => cy.animate({ zoom: cy.zoom() * 0.75, duration: 200 }));
    const unsubFit     = subscribeToolbar('fit',      () => cy.animate({ fit: { padding: 40 }, duration: 300 }));

    return () => {
      unsubZoomIn();
      unsubZoomOut();
      unsubFit();
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // Layout switch
  useEffect(() => {
    if (!cyRef.current) return;
    const layoutOpts = LAYOUT_OPTIONS[layout] || LAYOUT_OPTIONS['fcose'];
    cyRef.current.layout(layoutOpts).run();
  }, [layout]);

  // Filter by name
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('dimmed highlighted');
    if (!filterStr) return;
    const lower = filterStr.toLowerCase();
    cy.nodes().forEach((n) => {
      const label = (n.data('label') as string || '').toLowerCase();
      if (!label.includes(lower)) {
        n.addClass('dimmed');
      } else {
        n.addClass('highlighted');
      }
    });
  }, [filterStr]);

  // Highlight from chat answer
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || highlightedNodeIds.size === 0) return;
    cy.elements().addClass('dimmed').removeClass('highlighted');
    highlightedNodeIds.forEach((id) => {
      const node = cy.getElementById(id);
      if (node.length > 0) {
        node.closedNeighborhood().addClass('highlighted').removeClass('dimmed');
      }
    });
  }, [highlightedNodeIds]);

  // Hidden type filter
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().forEach((n) => {
      const type = n.data('type') as string;
      if (hiddenTypes.has(type)) {
        n.style({ 'display': 'none' });
      } else {
        n.style({ 'display': 'element' });
      }
    });
  }, [hiddenTypes]);

  return (
    <div
      ref={containerRef}
      id="cy"
      className="w-full h-full"
      style={{ background: '#0a0a0f' }}
    />
  );
}

// Expose zoom helpers for Toolbar
export function zoomIn(amount = 0.3) {
  // handled via store or ref passed externally
}
