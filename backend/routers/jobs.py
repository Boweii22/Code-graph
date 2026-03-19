import asyncio
import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException
from models.schemas import CreateJobRequest, JobResponse, JobStatus
from services import git_service, parser_service, graph_builder, neo4j_service, embedding_service

router = APIRouter()

# In-memory job store. In production use Redis.
jobs_db: dict = {}


async def process_repo(job_id: str, repo_url: str):
    try:
        def update(**kwargs):
            jobs_db[job_id].update(kwargs)

        update(status=JobStatus.CLONING, message='Cloning repository…', progress=10)
        repo_path = await git_service.clone_repo(repo_url, job_id)

        update(status=JobStatus.PARSING, message='Scanning source files…', progress=20)
        files = await asyncio.to_thread(git_service.get_source_files, repo_path)
        if not files:
            raise ValueError("No supported source files found in this repository.")

        update(message=f'Parsing {len(files)} files…', progress=35)
        parsed = await asyncio.to_thread(
            lambda: [parser_service.parse_file(f) for f in files]
        )

        update(message=f'Building knowledge graph from {len(files)} files…', progress=50)
        graph = await asyncio.to_thread(graph_builder.build_graph, repo_path, files, parsed)

        update(
            message=f'Storing {len(graph["nodes"])} nodes in Neo4j…',
            progress=60,
            node_count=len(graph['nodes']),
            edge_count=len(graph['edges']),
        )
        await neo4j_service.clear_job_graph(job_id)
        await neo4j_service.save_nodes(job_id, graph['nodes'])
        await neo4j_service.save_edges(job_id, graph['edges'])

        update(status=JobStatus.EMBEDDING, message='Generating vector embeddings…', progress=80)
        await neo4j_service.create_vector_index()
        embeddings = await embedding_service.embed_nodes(graph['nodes'])
        for emb in embeddings:
            await neo4j_service.save_embedding(emb['id'], job_id, emb['embedding'])

        git_service.cleanup_repo(job_id)
        update(status=JobStatus.READY, message='Ready!', progress=100)

    except Exception as e:
        import traceback
        traceback.print_exc()   # prints full stack trace to uvicorn console
        jobs_db[job_id].update({
            'status': JobStatus.ERROR,
            'error': str(e),
            'message': f'Error: {e}',
            'progress': 0,
        })
        git_service.cleanup_repo(job_id)


@router.post("/jobs", response_model=JobResponse)
async def create_job(req: CreateJobRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs_db[job_id] = {
        'job_id': job_id,
        'status': JobStatus.PENDING,
        'progress': 0,
        'message': 'Starting…',
        'node_count': 0,
        'edge_count': 0,
        'error': None,
    }
    background_tasks.add_task(process_repo, job_id, req.repo_url)
    return jobs_db[job_id]


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = jobs_db.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
