FROM python:3.11-slim AS build-env

ENV PORT 8080
ENV HOST 0.0.0.0
ENV PYTHONUNBUFFERED 1
WORKDIR /app

COPY . ./

RUN pip install --no-cache-dir pipenv==2023.12.1 && \
    pipenv requirements > requirements.txt && \
    pip install --no-cache-dir -r requirements.txt && \
    python -c 'from sentence_transformers import SentenceTransformer; SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", cache_folder="./app/artefacts")'


FROM gcr.io/distroless/python3

COPY --from=build-env /app /app
COPY --from=build-env /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=build-env /usr/local/bin/uvicorn /usr/local/bin/uvicorn

WORKDIR /app
CMD ["app/run.py"]
