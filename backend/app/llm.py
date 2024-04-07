import json
from typing import List, Generator, Any
from openai import OpenAI

client = OpenAI()

MODEL = "gpt-3.5-turbo-0613"

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


def format_chunks(chunks: List[dict]) -> str:
    result = ""
    for chunk in chunks:
        chunk.pop("id")
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
        model=MODEL,
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
        model="gpt-3.5-turbo-16k",
        temperature=0,
    )
    return result.choices[0].message.content
