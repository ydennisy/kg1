from typing import List, Dict

import instructor
from openai import OpenAI
from pydantic import BaseModel


def embed_text(text: str | list[str]) -> list[float] | list[list[float]]:
    client = OpenAI()
    result = client.embeddings.create(
        input=text, model="text-embedding-3-small", dimensions=256
    )

    embeddings = [d.embedding for d in result.data]
    if len(embeddings) == 1:
        return embeddings[0]
    return embeddings


class TextSummary(BaseModel):
    """A concise summary of a list of individual texts, which explains the grouping of the texts."""

    summary: str


def summarise_concept(texts: list[str]) -> str:
    client = instructor.from_openai(OpenAI())
    formatted_texts = "\n".join([f"{i+1}. {text}" for i, text in enumerate(texts)])
    prompt = f"""Summarize the following related texts:

{formatted_texts}

Provide a summary that captures the common theme across these texts.
DO NOT EXPLAIN OR REPEAT EACH TEXT."""

    return client.chat.completions.create(
        model="gpt-4o",
        response_model=TextSummary,
        messages=[
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )


class RelevantConcepts(BaseModel):
    concepts: List[int]


def select_relevant_concepts(
    query: str, concept_summaries: Dict[int, str], n: int
) -> List[int]:
    client = instructor.from_openai(OpenAI())
    formatted_summaries = "\n".join(
        [f"Concept {k}: {v}" for k, v in concept_summaries.items()]
    )
    prompt = f"""Given the following user query and concept summaries, select the {n} most relevant concepts:

Query: {query}

Concept Summaries:
{formatted_summaries}

Return only the concept numbers of the {n} most relevant concepts."""

    response = client.chat.completions.create(
        model="gpt-4o",
        response_model=RelevantConcepts,
        messages=[
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )
    return response.concepts


class SearchQueries(BaseModel):
    queries: List[str]


def generate_search_queries(query: str, concept_summary: str) -> List[str]:
    """
    Generate multiple search queries based on a user query and concept summary.

    Args:
        query (str): The user query.
        concept_summary (str): The concept summary.

    Returns:
        List[str]: A list of generated search queries.
    """
    client = instructor.from_openai(OpenAI())
    prompt = f"""Given the following user query and concept summary, generate multiple search queries that can be used to search a knowledge base:
QUERY: {query}
CONCEPT SUMMARY: {concept_summary}"""

    response = client.chat.completions.create(
        model="gpt-4o",
        response_model=SearchQueries,
        messages=[
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )
    return response.queries
