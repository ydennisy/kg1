from datetime import datetime
from sentence_transformers import SentenceTransformer

# MODEL_PATH = "app/artefacts/models--sentence-transformers--all-MiniLM-L6-v2"
# model = SentenceTransformer(MODEL_PATH)
# sentence-transformers/all-MiniLM-L6-v2
# tomaarsen/all-MiniLM-L6-v2
# mixedbread-ai/mxbai-embed-large-v1

model = None
def load_model():
    global model
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", cache_folder="./app/artefacts")

def record_time(task, args=(), kwargs={}):
    start_time = datetime.now()
    task(*args, **kwargs)

    return datetime.now() - start_time

print(f"Time taken to load embedding model: {record_time(load_model, )}")


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
