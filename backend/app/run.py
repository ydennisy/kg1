import os
import sys
from uvicorn import run

PORT = int(os.getenv("PORT", "8080"))
HOST = int(os.getenv("HOST", "0.0.0.0"))

if __name__ == "__main__":
    sys.exit(run("main:app", host=HOST, port=PORT))
