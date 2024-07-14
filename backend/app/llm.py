import json
from enum import Enum
from typing import List, Generator, Any
from openai import OpenAI

client = OpenAI()


class Models(Enum):
    GPT_4o_LATEST = "gpt-4o"


PROMPT_TEMPLATE = (
    "A question and context documents are provided below."
    "If the required information is not available in the context documents to answer the question,"
    "explain to the user that you are missing the required information."
    "If you are able to answer make sure you quote the source."
    "You will be provided a JSON line for each context document, which contains <text>, <title> & <url> keys."
    "At the END of your reply (not inline), you should list all unique sources using the <title> & <url> keys."
    "Answer using Markdown."
    "Use KaTex compatible syntax when replying with maths, MAKE SURE TO wrap inline equations with $ and use two ($$) for block rendering."
    "---------------------\n"
    "CONTEXT:\n"
    "{context}"
    "---------------------\n"
    "QUESTION:\n"
    "{question}"
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
        model=Models.GPT_4o_LATEST.value,
        stream=True,
        temperature=0.5,
    )
    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content
        else:
            yield ""


def summarise_text(text: str) -> str:
    words = text.split(" ")
    if len(words) > 1024:
        text = " ".join(words[:1024])

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
        model=Models.GPT_4o_LATEST.value,
        temperature=0,
    )
    return result.choices[0].message.content


def summarise_concept(texts: list[str]) -> str:
    formatted_texts = "\n".join([f"{i+1}. {text}" for i, text in enumerate(texts)])
    prompt = f"""Summarize the following related texts:

{formatted_texts}

Provide a summary that captures the common theme across these texts.
DO NOT EXPLAIN OR REPEAT EACH TEXT."""

    result = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )
    return result.choices[0].message.content
