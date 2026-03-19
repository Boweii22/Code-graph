import { create } from 'zustand';
import type { GraphNode, GraphEdge, ChatEntry } from './types';

interface GraphStore {
  jobId: string | null;
  repoUrl: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  highlightedNodeIds: Set<string>;
  sidebarOpen: boolean;
  chatOpen: boolean;
  chatHistory: ChatEntry[];
  hiddenTypes: Set<string>;
  filterStr: string;
  layout: string;

  setJob: (jobId: string, repoUrl?: string) => void;
  setGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  selectNode: (node: GraphNode | null) => void;
  setHighlight: (ids: string[]) => void;
  toggleType: (type: string) => void;
  addChatEntry: (entry: ChatEntry) => void;
  setFilter: (str: string) => void;
  setChatOpen: (open: boolean) => void;
  setLayout: (layout: string) => void;
  clearChat: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  jobId: null,
  repoUrl: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  highlightedNodeIds: new Set(),
  sidebarOpen: false,
  chatOpen: false,
  chatHistory: [],
  hiddenTypes: new Set(),
  filterStr: '',
  layout: 'fcose',

  setJob: (jobId, repoUrl) => set({ jobId, repoUrl: repoUrl ?? null }),

  setGraph: (nodes, edges) => set({ nodes, edges }),

  selectNode: (node) =>
    set({
      selectedNode: node,
      sidebarOpen: !!node,
    }),

  setHighlight: (ids) => set({ highlightedNodeIds: new Set(ids) }),

  toggleType: (type) =>
    set((state) => {
      const s = new Set(state.hiddenTypes);
      s.has(type) ? s.delete(type) : s.add(type);
      return { hiddenTypes: s };
    }),

  addChatEntry: (entry) =>
    set((state) => ({
      chatHistory: [...state.chatHistory, entry],
      chatOpen: true,
    })),

  setFilter: (str) => set({ filterStr: str }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setLayout: (layout) => set({ layout }),
  clearChat: () => set({ chatHistory: [], chatOpen: false }),
}));
