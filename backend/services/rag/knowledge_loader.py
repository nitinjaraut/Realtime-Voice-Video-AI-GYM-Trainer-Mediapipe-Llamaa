"""
Knowledge Loader — loads fitness markdown files into ChromaDB.

Splits documents into chunks and stores embeddings for retrieval.
Uses ChromaDB's built-in embedding function (all-MiniLM-L6-v2) so we
don't need to manage sentence-transformers separately.
"""

import os
import hashlib
import chromadb
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent / "data"
_CHROMA_DIR = Path(__file__).resolve().parent.parent.parent / "chroma_db"
_COLLECTION_NAME = "fitness_knowledge"


def _chunk_markdown(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Split markdown text into overlapping chunks by paragraph boundaries.
    Falls back to character-based splitting if paragraphs are too large.
    """
    paragraphs = text.split("\n\n")
    chunks: list[str] = []
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 2 <= chunk_size:
            current_chunk += ("\n\n" + para) if current_chunk else para
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            # If a single paragraph exceeds chunk_size, split it
            if len(para) > chunk_size:
                for i in range(0, len(para), chunk_size - overlap):
                    chunks.append(para[i : i + chunk_size].strip())
                current_chunk = ""
            else:
                current_chunk = para

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def _content_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()[:12]


def load_knowledge_base() -> chromadb.Collection:
    """
    Read all .md files from the data/ directory, chunk them,
    and upsert into ChromaDB. Returns the collection handle.
    """
    client = chromadb.PersistentClient(path=str(_CHROMA_DIR))

    collection = client.get_or_create_collection(
        name=_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    md_files = sorted(_DATA_DIR.glob("*.md"))

    all_ids: list[str] = []
    all_docs: list[str] = []
    all_metas: list[dict] = []

    for md_file in md_files:
        source_name = md_file.stem
        content = md_file.read_text(encoding="utf-8")
        chunks = _chunk_markdown(content)

        for i, chunk in enumerate(chunks):
            doc_id = f"{source_name}_{i}_{_content_hash(chunk)}"
            all_ids.append(doc_id)
            all_docs.append(chunk)
            all_metas.append({"source": source_name, "chunk_index": i})

    if all_ids:
        collection.upsert(ids=all_ids, documents=all_docs, metadatas=all_metas)

    return collection


def get_collection() -> chromadb.Collection:
    """Get or create the ChromaDB collection (lazy init)."""
    client = chromadb.PersistentClient(path=str(_CHROMA_DIR))
    return client.get_or_create_collection(
        name=_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
