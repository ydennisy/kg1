import umap
import numpy as np
from sklearn.cluster import KMeans
from sklearn.mixture import GaussianMixture

from app.db import DB
from app.llm import summarise_concept

db = DB()


class ConceptsService:
    def __init__(self):
        pass

    async def create_concepts(self, user_id: str):
        text_nodes = db.get_text_node_embeddings(user_id)
        n_concepts = len(text_nodes) // 32
        embeddings = [node["embedding"] for node in text_nodes]
        reducer = umap.UMAP(n_components=32, min_dist=0.0, metric="cosine")
        embeddings_2d = reducer.fit_transform(embeddings)
        # clusterer = KMeans(n_clusters=n_concepts)
        clusterer = GaussianMixture(n_components=n_concepts)
        clusters = clusterer.fit_predict(embeddings_2d)

        for idx, cluster in enumerate(clusters):
            text_nodes[idx]["cluster"] = cluster

        for cluster in np.unique(clusters):
            filtered = [node for node in text_nodes if node["cluster"] == cluster]
            titles = [node["title"] for node in filtered]
            summary = summarise_concept(titles)
            print(summary)
