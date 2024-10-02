import os
from typing import Annotated

from fastapi import Header, HTTPException
from supabase import create_client
from app.config import config

client = create_client(
    supabase_url=config.SUPABASE_URL, supabase_key=config.SUPABASE_KEY
)


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
