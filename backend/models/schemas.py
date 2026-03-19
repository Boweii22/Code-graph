from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "pending"
    CLONING = "cloning"
    PARSING = "parsing"
    EMBEDDING = "embedding"
    READY = "ready"
    ERROR = "error"


class CreateJobRequest(BaseModel):
    repo_url: str


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: int = 0        # 0-100
    message: str             # human-readable status message
    node_count: int = 0
    edge_count: int = 0
    error: Optional[str] = None


class GraphNode(BaseModel):
    id: str
    type: str                # File | Class | Function | Module
    label: str
    shortLabel: str
    file: Optional[str] = None
    language: Optional[str] = None
    lineStart: Optional[int] = None
    lineEnd: Optional[int] = None
    sourcePreview: Optional[str] = None  # first 10 lines of function body
    callCount: int = 0
    calledByCount: int = 0


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str                # CALLS | IMPORTS | DEFINED_IN | BELONGS_TO | DEPENDS_ON | INHERITS_FROM


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    stats: dict


class QueryRequest(BaseModel):
    question: str
    job_id: str
    context_node_ids: Optional[List[str]] = None


class QueryResponse(BaseModel):
    answer: str
    retrieved_nodes: List[str]    # node IDs used as context
    retrieved_edges: List[str]    # edge IDs used as context
    suggested_followups: List[str]
