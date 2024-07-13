# %%
import importlib
from typing import List, Dict

import numpy as np
from openai import OpenAI
from sklearn.cluster import KMeans
from llama_index.core.text_splitter import SentenceSplitter
from dotenv import load_dotenv

load_dotenv()

from lib import llm

importlib.reload(llm)

docs = [
    "The Eiffel Tower, located in Paris, France, was completed in 1889.",
    "Photosynthesis is the process by which plants use sunlight to produce energy from carbon dioxide and water.",
    "The first manned moon landing occurred on July 20, 1969, as part of NASA's Apollo 11 mission.",
    "Shakespeare wrote 37 plays and 154 sonnets during his lifetime.",
    "The human genome contains approximately 3 billion base pairs of DNA.",
    "Climate change is causing global temperatures to rise and weather patterns to become more extreme.",
    "The Great Wall of China is over 13,000 miles long and took centuries to build.",
    "Artificial intelligence is rapidly advancing, with applications in various fields including healthcare and finance.",
    "The theory of relativity, proposed by Albert Einstein, revolutionized our understanding of space and time.",
    "The Amazon rainforest produces about 20% of the world's oxygen and is home to millions of species.",
    "The Internet was initially developed for military purposes before becoming a global network.",
    "Vincent van Gogh painted 'The Starry Night' in 1889 while staying at an asylum in France.",
    "Quantum computing uses quantum-mechanical phenomena to perform operations on data.",
    "The human brain contains approximately 86 billion neurons.",
    "The Mona Lisa, painted by Leonardo da Vinci, is one of the most famous artworks in the world.",
    "Blockchain technology is being explored for applications beyond cryptocurrency.",
    "The Great Barrier Reef is the world's largest coral reef system, visible from space.",
    "Machine learning algorithms improve their performance with experience without being explicitly programmed.",
    "The first Olympic Games were held in ancient Greece in 776 BC.",
    "Renewable energy sources like solar and wind power are becoming increasingly important in fighting climate change.",
]


"""
FINAL ALGO IDEA:
Split the docs into chunks and create groups of chunks as concepts. (DONE)
Summarise these concepts. (DONE)
At query time, ask the LLM to pick the N most relevant concepts.
For each concept, ask the LLM to write a specific query to fetch nodes.
Use nodes to write an answer from each concept.
Final step is to write a holistic answer based on all concepts.
But tell the LLM to explain how it used different areas.
Expose the steps to the user not just final answer
"""

open_ai = OpenAI()


# %%
class ConceptBasedRAG:
    def __init__(self, documents: List[str], n_concepts: int = 10):
        self.documents = documents
        self.n_concepts = n_concepts
        self.chunks = None
        self.chunk_embeddings = None
        self.concept_clusters = None
        self.concept_summaries = None
        self.split_documents()
        self.create_concepts()
        self.summarize_concepts()

    def split_documents(self) -> List[str]:
        text_splitter = SentenceSplitter()
        chunks = text_splitter.split_texts(self.documents)
        self.chunks = chunks

    def create_concepts(self):
        embeddings = llm.embed_text(self.chunks)
        self.chunk_embeddings = embeddings
        kmeans = KMeans(n_clusters=self.n_concepts, random_state=42)
        self.concept_clusters = kmeans.fit_predict(self.chunk_embeddings)

    def get_concept_chunks(self) -> Dict[int, List[str]]:
        if self.concept_clusters is None:
            raise ValueError(
                "Concepts have not been created yet. Call create_concepts() first."
            )

        concept_chunks = {i: [] for i in range(self.n_concepts)}
        for chunk, cluster in zip(self.chunks, self.concept_clusters):
            concept_chunks[cluster].append(chunk)

        return concept_chunks

    def summarize_concepts(self):
        concept_chunks = self.get_concept_chunks()
        self.concept_summaries = {}
        for concept, chunks in concept_chunks.items():
            summary = llm.summarise_concept(chunks).summary
            self.concept_summaries[concept] = summary

    def get_concept_summaries(self) -> Dict[int, str]:
        if self.concept_summaries is None:
            raise ValueError("Concept summaries have not been generated yet.")
        return self.concept_summaries

    def query(self, query: str, n: int = 1) -> List[int]:
        relevant_concept_indices = llm.select_relevant_concepts(
            query, self.get_concept_summaries(), n=n
        )
        for idx in relevant_concept_indices:
            concept = self.get_concept_summaries()[idx]
            search_queries = llm.generate_search_queries(query, concept)
            print(search_queries)


# %%
rag = ConceptBasedRAG(docs, n_concepts=5)
concept_summaries = rag.get_concept_summaries()

for concept, summary in concept_summaries.items():
    print(f"Concept {concept}:")
    print(f"Summary: {summary}")
    for chunk in rag.get_concept_chunks()[concept]:
        print(f"  - {chunk}")

# %%
rag.query("what is the best building in Europe?", n=5)
# %%
# %%
