import os
from openai import AsyncOpenAI

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def embed_text(text: str) -> list:
    """Generate embedding for a text string."""
    text = text[:8000]  # truncate to stay within token limit
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


async def embed_nodes(nodes: list) -> list:
    """Embed all function/class nodes for vector search."""
    results = []
    for node in nodes:
        if node['type'] in ('Function', 'Class'):
            text = (
                f"{node['type']} {node['label']} "
                f"in {node.get('file', '')}. "
                f"{node.get('sourcePreview', '')}"
            )
            embedding = await embed_text(text)
            results.append({'id': node['id'], 'embedding': embedding})
    return results
