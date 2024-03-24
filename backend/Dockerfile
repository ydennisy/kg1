FROM python:3.11-slim

ENV PORT 8080
ENV HOST 0.0.0.0
ENV PYTHONUNBUFFERED 1
WORKDIR /app

COPY . ./

RUN pip install --no-cache-dir pipenv==2023.12.1 && \
    pipenv requirements > requirements.txt && \
    pip install --no-cache-dir -r requirements.txt && \
    python -c 'from sentence_transformers import SentenceTransformer; SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2", cache_folder="./app/artefacts")'

CMD exec uvicorn app.main:app --host $HOST --port $PORT --workers 2
