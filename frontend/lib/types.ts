export type NodeType = 'File' | 'Class' | 'Function' | 'Module';

export type EdgeType =
  | 'CALLS'
  | 'IMPORTS'
  | 'DEFINED_IN'
  | 'BELONGS_TO'
  | 'DEPENDS_ON'
  | 'INHERITS_FROM';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  shortLabel: string;
  file?: string;
  language?: string;
  lineStart?: number;
  lineEnd?: number;
  sourcePreview?: string;
  callCount?: number;
  calledByCount?: number;
  [key: string]: unknown;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
}

export type JobStatus =
  | 'pending'
  | 'cloning'
  | 'parsing'
  | 'embedding'
  | 'ready'
  | 'error';

export interface Job {
  job_id: string;
  status: JobStatus;
  progress: number;
  message: string;
  node_count: number;
  edge_count: number;
  error?: string;
}

export interface ChatEntry {
  question: string;
  answer: string;
  nodeIds: string[];
  edgeIds: string[];
  followups: string[];
}

export interface QueryResponse {
  answer: string;
  retrieved_nodes: string[];
  retrieved_edges: string[];
  suggested_followups: string[];
}
