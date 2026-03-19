import anthropic
import json
from services.neo4j_service import vector_search, expand_subgraph, _mem_nodes
from services.embedding_service import embed_text, has_openai

claude = anthropic.Anthropic()

SYSTEM_PROMPT = """You are an expert code analyst. You are given a subgraph from a codebase \
knowledge graph and must answer questions about the code architecture.

Always be specific: mention exact function names, file paths, and relationships.
Format your answer in clean markdown with headers and bullet points where appropriate.
End your response with exactly 3 follow-up questions the user might want to ask, \
formatted as a JSON array on the last line like: FOLLOWUPS: ["q1", "q2", "q3"]"""


async def _keyword_search(job_id: str, question: str, top_k: int = 5) -> list:
    """Fallback: simple keyword match when no embeddings available."""
    words = [w.lower() for w in question.split() if len(w) > 3]
    scored = []
    for node in _mem_nodes.values():
        if node.get("job_id") != job_id:
            continue
        label = (node.get("label") or "").lower()
        score = sum(1 for w in words if w in label)
        if score > 0:
            scored.append((score, node))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [{"id": n["id"], "label": n.get("label"), "type": n.get("type")} for _, n in scored[:top_k]]


async def graphrag_query(question: str, job_id: str, context_node_ids: list = None) -> dict:
    # 1. Find seed nodes
    if has_openai():
        q_embedding = await embed_text(question)
        vector_seeds = await vector_search(job_id, q_embedding, top_k=5)
    else:
        vector_seeds = await _keyword_search(job_id, question, top_k=5)

    seed_ids = list(set(
        [n['id'] for n in vector_seeds] + (context_node_ids or [])
    ))

    # 2. Expand subgraph 2 hops
    subgraph = await expand_subgraph(job_id, seed_ids, hops=2)

    # 3. Serialize for Claude
    context = serialize_subgraph(subgraph)

    # 4. Call Claude
    response = claude.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"Codebase knowledge graph subgraph:\n{context}\n\nQuestion: {question}",
        }],
    )

    raw_answer = response.content[0].text

    # 5. Parse follow-ups
    followups = []
    answer = raw_answer
    if 'FOLLOWUPS:' in raw_answer:
        parts = raw_answer.split('FOLLOWUPS:')
        answer = parts[0].strip()
        try:
            followups = json.loads(parts[1].strip())
        except Exception:
            followups = []

    return {
        'answer': answer,
        'retrieved_nodes': [n.get('id') for n in subgraph['nodes'] if n.get('id')],
        'retrieved_edges': [
            f"{e['source']}-{e['type']}-{e['target']}"
            for e in subgraph['edges']
        ],
        'suggested_followups': followups[:3],
    }


def serialize_subgraph(subgraph: dict) -> str:
    lines = ["NODES:"]
    for n in subgraph['nodes'][:40]:
        lines.append(
            f"  [{n.get('type', '?')}] {n.get('label', '?')} "
            f"| file: {n.get('file', '?')} "
            f"| lines: {n.get('lineStart', '?')}-{n.get('lineEnd', '?')}"
        )
    lines.append("\nRELATIONSHIPS:")
    for e in subgraph['edges'][:80]:
        lines.append(f"  {e['source']} --{e['type']}--> {e['target']}")
    return '\n'.join(lines)
