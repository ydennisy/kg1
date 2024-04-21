FROM debian:12-slim AS build

RUN apt-get update && \
    apt-get install --no-install-suggests --no-install-recommends --yes python3-venv gcc libpython3-dev && \
    python3 -m venv /venv && \
    /venv/bin/pip install --upgrade pip setuptools wheel pipenv==2023.12.1


FROM build AS build-venv

COPY Pipfile.lock /Pipfile.lock
RUN /venv/bin/pipenv requirements > requirements.txt && \
    /venv/bin/pip uninstall -y pipenv && \
    /venv/bin/pip install --disable-pip-version-check -r /requirements.txt

FROM gcr.io/distroless/python3-debian12

ENV PORT 8080
ENV HOST 0.0.0.0
ENV PYTHONUNBUFFERED 1

COPY --from=build-venv /venv /venv
COPY . /app
WORKDIR /app

ENTRYPOINT ["/venv/bin/python3", "run.py"]
