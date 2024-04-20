import os
import sys
from uvicorn import run

# TODO: fix it!
# https://github.com/alexdmoss/distroless-python/tree/main/tests/fastapi
# https://github.com/GoogleContainerTools/distroless/blob/main/examples/python3/Dockerfile
# https://alexos.dev/2022/07/08/creating-an-up-to-date-distroless-python-image/
# https://groups.google.com/g/distroless-users/c/1WYBzcsggk8

PORT = int(os.getenv("PORT", "8080"))
HOST = os.getenv("HOST", "0.0.0.0")

if __name__ == "__main__":
    sys.exit(run("app.main:app", host=HOST, port=PORT))
