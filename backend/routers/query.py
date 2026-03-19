from fastapi import APIRouter
from models.schemas import QueryRequest, QueryResponse
from services.graphrag_service import graphrag_query

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_graph(req: QueryRequest):
    result = await graphrag_query(req.question, req.job_id, req.context_node_ids)
    return result
