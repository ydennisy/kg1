from sentence_transformers import SentenceTransformer

#MODEL_PATH = "app/artefacts/models--sentence-transformers--all-MiniLM-L6-v2"
#model = SentenceTransformer(MODEL_PATH)
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", cache_folder="./app/artefacts")


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
