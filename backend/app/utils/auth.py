import os
from typing import Annotated

from fastapi import Header, HTTPException
from supabase import create_client

client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


def get_current_user(authorization: Annotated[str | None, Header()] = None):
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Authorization token is missing or invalid."
        )

    token = authorization.split(" ")[1]
    try:
        user = client.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials."
        )

    if user is None:
        raise HTTPException(status_code=401, detail="User not found.")

    return user.user


def get_user_by_id(id: str):
    return client.auth.admin.get_user_by_id(id)
