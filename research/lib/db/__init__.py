import os

from supabase import create_client, Client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
client: Client = create_client(url, key)


def get_text_nodes(limit: int = 10000):
    response = client.table("text_nodes").select("*").limit(limit).execute()
    return response.data


def get_text_node_chunks(limit: int = 10000):
    response = client.table("text_node_chunks").select("*").limit(limit).execute()
    return response.data
