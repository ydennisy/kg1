from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


class NodeEmbedder:
    @staticmethod
    def embed(texts: str | list[str], return_type: str = "np") -> list[float]:
        embeddings = model.encode(texts)
        if return_type == "np":
            return embeddings
        elif return_type == "list":
            return embeddings.tolist()
        else:
            raise ValueError(f"unsupported return_type: {return_type}")
