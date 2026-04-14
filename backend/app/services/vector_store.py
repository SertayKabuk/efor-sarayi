import chromadb

from app.config import settings


class VectorStore:
    def __init__(self):
        self._client: chromadb.HttpClient | None = None
        self._collection = None

    def _get_collection(self):
        if self._collection is None:
            self._client = chromadb.HttpClient(
                host=settings.chroma_host, port=settings.chroma_port
            )
            self._collection = self._client.get_or_create_collection(
                name="project_embeddings",
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    def upsert_project(
        self,
        project_id: str,
        embedding: list[float],
        document: str,
        metadata: dict,
    ):
        collection = self._get_collection()
        collection.upsert(
            ids=[project_id],
            embeddings=[embedding],
            documents=[document],
            metadatas=[metadata],
        )

    def query_similar(
        self, embedding: list[float], top_k: int = 5
    ) -> dict:
        collection = self._get_collection()
        return collection.query(
            query_embeddings=[embedding],
            n_results=top_k,
            include=["metadatas", "distances", "documents"],
        )

    def delete_project(self, project_id: str):
        collection = self._get_collection()
        collection.delete(ids=[project_id])


vector_store = VectorStore()
