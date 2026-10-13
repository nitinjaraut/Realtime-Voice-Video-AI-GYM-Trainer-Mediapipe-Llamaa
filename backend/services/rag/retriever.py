"""
Retriever — queries ChromaDB for relevant fitness knowledge chunks.

Returns the top-k most relevant passages given a user question.
Includes a relevance threshold to prevent returning low-quality matches.
"""

from services.rag.knowledge_loader import get_collection


def retrieve(query: str, top_k: int = 3, max_distance: float = 1.5) -> list[dict]:
    """
    Query the fitness knowledge base.

    Args:
        query: The user's question.
        top_k: Number of results to return.
        max_distance: Maximum cosine distance (lower = more relevant).
                      Chunks with distance > max_distance are filtered out.

    Returns:
        List of dicts with keys: text, source, distance
        Empty list if nothing relevant is found (zero-retrieval scenario).
    """
    collection = get_collection()

    # Check if the collection has any documents
    if collection.count() == 0:
        return []

    results = collection.query(
        query_texts=[query],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    chunks: list[dict] = []

    if not results["documents"] or not results["documents"][0]:
        return chunks

    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        # Filter out low-relevance results
        if dist <= max_distance:
            chunks.append({
                "text": doc,
                "source": meta.get("source", "unknown"),
                "distance": round(dist, 4),
            })

    return chunks


def format_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string for the LLM prompt."""
    if not chunks:
        return ""

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk["source"].replace("_", " ").title()
        context_parts.append(f"[Source: {source}]\n{chunk['text']}")

    return "\n\n---\n\n".join(context_parts)
