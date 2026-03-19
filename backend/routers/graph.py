import traceback
from fastapi import APIRouter, HTTPException
from services import neo4j_service

router = APIRouter()


@router.get("/graph/{job_id}")
async def get_graph(job_id: str):
    try:
        data = await neo4j_service.get_full_graph(job_id)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    if not data['nodes']:
        raise HTTPException(status_code=404, detail="Graph not found or still processing")

    # Enrich nodes with calledBy counts
    call_counts: dict = {}
    for edge in data['edges']:
        if edge.get('type') == 'CALLS':
            tgt = edge.get('target')
            if tgt:
                call_counts[tgt] = call_counts.get(tgt, 0) + 1

    for node in data['nodes']:
        node['calledByCount'] = call_counts.get(node.get('id'), 0)

    return data
