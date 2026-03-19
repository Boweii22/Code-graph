import os

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
_client = None


def _get_client():
    global _client
    if _client is None:
        from openai import AsyncOpenAI
        _client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    return _client


def has_openai() -> bool:
    return bool(OPENAI_API_KEY)


async def embed_text(text: str) -> list:
    """Generate embedding. Returns empty list if no API key."""
    if not has_openai():
        return []
    text = text[:8000]
    response = await _get_client().embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


async def embed_nodes(nodes: list) -> list:
    """Embed function/class nodes. Silently skips if no API key."""
    if not has_openai():
        print("[embeddings] No OPENAI_API_KEY — skipping embeddings (AI search will use keyword fallback)")
        return []
    results = []
    for node in nodes:
        if node['type'] in ('Function', 'Class'):
            text = (
                f"{node['type']} {node['label']} "
                f"in {node.get('file', '')}. "
                f"{node.get('sourcePreview', '')}"
            )
            embedding = await embed_text(text)
            if embedding:
                results.append({'id': node['id'], 'embedding': embedding})
    return results
