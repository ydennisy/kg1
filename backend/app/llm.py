import json
from typing import List, Generator, Any

import instructor
from openai import OpenAI
from pydantic import BaseModel

client = OpenAI()

MODEL_16K = "gpt-3.5-turbo-0125"

PROMPT_TEMPLATE = (
    "A question and context documents are provided below."
    "If the required information is not available in the context documents to answer the question,"
    "explain to the user that you are missing the required information."
    "If you are able to answer make sure you quote the source."
    "You will be provided a JSON line for each context document, which contains <text>, <title> & <url> keys."
    "At the END of your reply (not inline), you should list all unique sources using the <title> & <url> keys."
    "Answer using Markdown."
    "---------------------\n"
    "CONTEXT:\n"
    "{context}"
    "---------------------\n"
    "QUESTION:\n"
    "{question}"
)

EXTRACT_CONCEPTS_PROMPT_TEMPLATE = (
    "Please extract ONLY THE MOST IMPORTANT concepts, entities & topics from the provided text."
    "DO NOT provide more than 8 results per text article."
    "MAKE SURE the oncepts, entities & topics you select are relevant to the overall article, and are not ads or examples."
    "---------------------\n"
    "TEXT:\n"
    "{text}"
)

EXTRACT_CONCEPTS_SYSTEM_PROMPT_TEMPLATE = (
    "You are an information extraction system. You respond to each message with a list of useful named entities."
    "Each named entity appears as one entry in a list."
    "Ignore unimportant entities, e.g., of type formatting, citations, and references."
    "The types of entities that we are most interested in are human, artificial object, spatio-temporal entity, corporate body, concrete object, talk, geographical feature, natural object, product, system."
    "IMPORTANT: you only include entities that appear in the text."
)


def format_chunks(chunks: List[dict]) -> str:
    result = ""
    for chunk in chunks:
        chunk.pop("id")
        if "score" in chunk:
            chunk.pop("score")
        result += f"{json.dumps(chunk)}\n"
    return result


def answer_with_context(chunks: List[dict], question: str) -> Generator[str, Any, Any]:
    formatted_chunks = format_chunks(chunks)
    messages = [
        {
            "role": "user",
            "content": PROMPT_TEMPLATE.format(
                context=formatted_chunks, question=question
            ),
        }
    ]
    stream = client.chat.completions.create(
        messages=messages,
        model=MODEL_16K,
        stream=True,
        temperature=0,
    )
    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content
        else:
            yield ""


def summarise_text(text: str) -> str:
    messages = [
        {
            "role": "system",
            "content": "You are a article summary AI.",
        },
        {
            "role": "user",
            "content": f"Summarise the following ARTICLE, making sure to provide good depth, and cover all important topics. \n ARTICLE: \n {text}",
        },
    ]
    result = client.chat.completions.create(
        messages=messages,
        model=MODEL_16K,
        temperature=0,
    )
    return result.choices[0].message.content


class NodeConcepts(BaseModel):
    """
    Represents a list of key concepts and entities extracted from text.
    """

    concepts: list[str]


def extract_concepts(text: str) -> list[str]:
    client = instructor.from_openai(OpenAI())

    node_concepts = client.chat.completions.create(
        model=MODEL_16K,
        temperature=0,
        response_model=NodeConcepts,
        messages=[
            {
                "role": "system",
                "content": "EXTRACT_CONCEPTS_SYSTEM_PROMPT_TEMPLATE",
            },
            {
                "role": "user",
                "content": EXTRACT_CONCEPTS_PROMPT_TEMPLATE.format(text=text),
            },
        ],
    )

    concepts = [n.lower().replace(" ", "-") for n in node_concepts.concepts]

    return concepts
