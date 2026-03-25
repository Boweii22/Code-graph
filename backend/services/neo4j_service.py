"""
Neo4j service with automatic in-memory fallback.

If NEO4J_URI is not set (or connection fails), all graph data is stored in
memory so the app works for demos without a Neo4j instance.
"""

import os
import numpy as np
from typing import Optional

URI      = os.getenv("NEO4J_URI", "")
USER     = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "")

# ── In-memory store (always used as fallback) ─────────────────────────────────
_mem_nodes: dict[str, dict] = {}   # node_id -> props
_mem_edges: list[dict]      = []   # [{source, target, type}]


def _use_neo4j() -> bool:
    return bool(URI and PASSWORD)


def _get_driver():
    from neo4j import AsyncGraphDatabase
    return AsyncGraphDatabase.driver(URI, auth=(USER, PASSWORD))


_driver = None


def get_driver():
    global _driver
    if _driver is None:
        _driver = _get_driver()
    return _driver


# ── Public API ────────────────────────────────────────────────────────────────

async def clear_job_graph(job_id: str):
    # Clear memory store
    for k in [k for k, v in _mem_nodes.items() if v.get("job_id") == job_id]:
        del _mem_nodes[k]
    global _mem_edges
    _mem_edges = [e for e in _mem_edges if e.get("job_id") != job_id]

    if _use_neo4j():
        try:
            async with get_driver().session() as s:
                await s.run("MATCH (n {job_id: $job_id}) DETACH DELETE n", job_id=job_id)
        except Exception as e:
            print(f"[neo4j] clear_job_graph failed (using memory): {e}")


_BATCH = 500  # nodes/edges per Neo4j batch


async def save_nodes(job_id: str, nodes: list):
    for node in nodes:
        props = {k: v for k, v in node.items() if v is not None}
        props["job_id"] = job_id
        _mem_nodes[node["id"]] = props

    if _use_neo4j():
        try:
            async with get_driver().session() as s:
                # Group by type so we can use a typed UNWIND batch per label
                from collections import defaultdict
                by_type: dict = defaultdict(list)
                for node in nodes:
                    props = {k: v for k, v in node.items() if v is not None}
                    props["job_id"] = job_id
                    by_type[node["type"]].append(props)
                for label, batch in by_type.items():
                    for i in range(0, len(batch), _BATCH):
                        chunk = batch[i:i + _BATCH]
                        await s.run(
                            f"UNWIND $rows AS row MERGE (n:{label} {{id: row.id, job_id: row.job_id}}) SET n += row",
                            rows=chunk,
                        )
        except Exception as e:
            print(f"[neo4j] save_nodes failed (using memory): {e}")


async def save_edges(job_id: str, edges: list):
    for edge in edges:
        _mem_edges.append({**edge, "job_id": job_id})

    if _use_neo4j():
        try:
            async with get_driver().session() as s:
                from collections import defaultdict
                by_type: dict = defaultdict(list)
                for edge in edges:
                    by_type[edge["type"]].append({"src": edge["source"], "tgt": edge["target"]})
                for rel_type, batch in by_type.items():
                    for i in range(0, len(batch), _BATCH):
                        chunk = batch[i:i + _BATCH]
                        await s.run(
                            f"""
                            UNWIND $rows AS row
                            MATCH (a {{id: row.src, job_id: $job_id}})
                            MATCH (b {{id: row.tgt, job_id: $job_id}})
                            MERGE (a)-[r:{rel_type} {{job_id: $job_id}}]->(b)
                            """,
                            rows=chunk, job_id=job_id,
                        )
        except Exception as e:
            print(f"[neo4j] save_edges failed (using memory): {e}")


async def create_vector_index():
    if not _use_neo4j():
        return
    try:
        async with get_driver().session() as s:
            await s.run("""
                CREATE VECTOR INDEX function_embeddings IF NOT EXISTS
                FOR (n:Function) ON (n.embedding)
                OPTIONS {indexConfig: {
                    `vector.dimensions`: 1536,
                    `vector.similarity_function`: 'cosine'
                }}
            """)
    except Exception:
        pass


async def save_embedding(node_id: str, job_id: str, embedding: list):
    if node_id in _mem_nodes:
        _mem_nodes[node_id]["embedding"] = embedding

    if _use_neo4j():
        try:
            async with get_driver().session() as s:
                await s.run(
                    "MATCH (n {id: $node_id, job_id: $job_id}) SET n.embedding = $embedding",
                    node_id=node_id, job_id=job_id, embedding=embedding,
                )
        except Exception as e:
            print(f"[neo4j] save_embedding failed (using memory): {e}")


async def vector_search(job_id: str, embedding: list, top_k: int = 5) -> list:
    # In-memory cosine similarity
    candidates = [
        n for n in _mem_nodes.values()
        if n.get("job_id") == job_id and n.get("embedding")
    ]
    if not candidates:
        return []

    q = np.array(embedding, dtype=np.float32)
    scored = []
    for n in candidates:
        v = np.array(n["embedding"], dtype=np.float32)
        denom = (np.linalg.norm(q) * np.linalg.norm(v))
        score = float(np.dot(q, v) / denom) if denom > 0 else 0.0
        scored.append({"id": n["id"], "label": n.get("label"), "type": n.get("type"), "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]


async def expand_subgraph(job_id: str, node_ids: list, hops: int = 2) -> dict:
    if not node_ids:
        return {"nodes": [], "edges": []}

    # BFS over in-memory graph
    visited = set(node_ids)
    frontier = set(node_ids)

    job_edges = [e for e in _mem_edges if e.get("job_id") == job_id]

    for _ in range(hops):
        next_frontier = set()
        for e in job_edges:
            if e["source"] in frontier and e["target"] not in visited:
                next_frontier.add(e["target"])
            if e["target"] in frontier and e["source"] not in visited:
                next_frontier.add(e["source"])
        visited |= next_frontier
        frontier = next_frontier

    nodes = [_mem_nodes[nid] for nid in visited if nid in _mem_nodes]
    edges = [
        {"source": e["source"], "target": e["target"], "type": e["type"]}
        for e in job_edges
        if e["source"] in visited and e["target"] in visited
    ]
    return {"nodes": nodes, "edges": edges}


async def get_full_graph(job_id: str) -> dict:
    nodes = [n for n in _mem_nodes.values() if n.get("job_id") == job_id]
    edges = [
        {"id": f"{e['source']}_{e['type']}_{e['target']}",
         "source": e["source"], "target": e["target"], "type": e["type"]}
        for e in _mem_edges if e.get("job_id") == job_id
    ]

    # If Neo4j is configured and memory is empty, try Neo4j
    if _use_neo4j() and not nodes:
        try:
            async with get_driver().session() as s:
                nr = await s.run("MATCH (n {job_id: $job_id}) RETURN properties(n) AS n", job_id=job_id)
                er = await s.run("""
                    MATCH (a {job_id: $job_id})-[r]->(b {job_id: $job_id})
                    RETURN a.id AS source, b.id AS target, type(r) AS type,
                           a.id + '_' + type(r) + '_' + b.id AS id
                """, job_id=job_id)
                nodes = [dict(r)["n"] async for r in nr]
                edges = [dict(r) async for r in er]
        except Exception as e:
            print(f"[neo4j] get_full_graph failed (using memory): {e}")

    return {"nodes": nodes, "edges": edges}
