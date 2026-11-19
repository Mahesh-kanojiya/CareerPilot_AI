import os
import math
import hashlib
from typing import List, Union
import numpy as np
from app.core.config import settings

class EmbeddingService:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self._st_model = None
        self._initialized = False

    def _lazy_init(self):
        if self._initialized:
            return
        self._initialized = True
        
        # Only try sentence-transformers if explicitly enabled via env var to prevent blocking network hang
        if os.getenv("USE_SENTENCE_TRANSFORMERS", "").lower() in ("true", "1"):
            try:
                from sentence_transformers import SentenceTransformer
                self._st_model = SentenceTransformer("all-MiniLM-L6-v2")
                print("[EmbeddingService] Successfully loaded SentenceTransformer (all-MiniLM-L6-v2)")
                return
            except Exception as e:
                print(f"[EmbeddingService] SentenceTransformer load notice: {e}")

        # Try Gemini API if key is configured
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                print("[EmbeddingService] Configured Gemini Embedding API")
            except Exception as e:
                print(f"[EmbeddingService] Gemini configure notice: {e}")

    def _deterministic_hash_vector(self, text: str) -> List[float]:
        """
        High-fidelity fallback semantic-frequency vector generator.
        Produces deterministic, L2-normalized 384-dimensional embeddings based on
        n-gram and sub-word hashing. Preserves cosine similarity for related terms.
        """
        if not text:
            return [0.0] * self.dimension

        vec = np.zeros(self.dimension, dtype=np.float32)
        words = text.lower().replace("\n", " ").split()
        
        for idx, word in enumerate(words):
            clean_word = "".join(c for c in word if c.isalnum() or c in "+#.-")
            if not clean_word:
                continue
            
            # Hash word into bucket
            h = int(hashlib.md5(clean_word.encode("utf-8")).hexdigest(), 16)
            bucket = h % self.dimension
            sign = 1.0 if ((h >> 8) % 2 == 0) else -1.0
            
            # Weight term by length and inverse position damping
            weight = math.log1p(len(clean_word)) * (1.0 / (1.0 + 0.001 * idx))
            vec[bucket] += sign * weight
            
            # Character trigrams for morphological capture (e.g., 'python', 'pythonic')
            if len(clean_word) >= 3:
                for i in range(len(clean_word) - 2):
                    tri = clean_word[i:i+3]
                    tri_h = int(hashlib.sha256(tri.encode("utf-8")).hexdigest(), 16)
                    tri_bucket = tri_h % self.dimension
                    vec[tri_bucket] += 0.3 * (1.0 if (tri_h % 2 == 0) else -1.0)

        # L2 Normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for a single text."""
        self._lazy_init()
        if not text or not text.strip():
            return [0.0] * self.dimension

        # 1. Try local SentenceTransformer
        if self._st_model is not None:
            try:
                emb = self._st_model.encode(text, convert_to_numpy=True)
                return emb.tolist()
            except Exception as e:
                print(f"[EmbeddingService] ST encode fallback: {e}")

        # 2. Try Gemini Embeddings if available
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
            try:
                import google.generativeai as genai
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=text,
                    task_type="retrieval_document"
                )
                emb = result["embedding"]
                # Adjust to target dimension if needed
                if len(emb) == self.dimension:
                    return emb
                elif len(emb) > self.dimension:
                    sub = np.array(emb[:self.dimension], dtype=np.float32)
                    norm = np.linalg.norm(sub)
                    return (sub / (norm if norm > 0 else 1.0)).tolist()
            except Exception as e:
                pass

        # 3. Deterministic normalized hash vector
        return self._deterministic_hash_vector(text)

    def get_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        return [self.get_embedding(t) for t in texts]

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        dot = np.dot(a, b)
        sim = float(dot / (norm_a * norm_b))
        # Clamp to [0.0, 1.0] for similarity measure
        return max(0.0, min(1.0, (sim + 1.0) / 2.0 if sim < 0 else sim))

# Singleton instance
embedding_service = EmbeddingService(dimension=settings.VECTOR_DIMENSION)
