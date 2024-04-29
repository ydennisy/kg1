from openai import OpenAI


client = OpenAI()


class NodeEmbedder:
    @staticmethod
    def embed(texts: str | list[str]) -> list[float]:
        is_input_single_text = False
        if isinstance(texts, str):
            texts = [texts]
            is_input_single_text = True

        embeddings = []
        for text in texts:
            # TODO: need a better more global way to handle overly long input documents.
            words = text.split(" ")
            if len(words) > 1024:
                text = " ".join(words[:1024])
            response = client.embeddings.create(
                input=text, model="text-embedding-3-small", dimensions=256
            )
            embeddings.append(response.data[0].embedding)

        if is_input_single_text:
            return embeddings[0]

        return embeddings
