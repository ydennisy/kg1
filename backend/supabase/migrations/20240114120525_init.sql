create extension vector;

create type
  url_status as enum (
    'RECEIVED_AWAITING_INDEXING',
    'INDEXING_SKIPED_AS_RECENT_DUPLICATE',
    'INDEXED_SUCCESSFULLY',
    'INDEXING_FAILED'
  );

create table
  public.urls_feed (
    id uuid primary key,
    status url_status,
    user_id text not null,
    created_at timestamp with time zone not null default now(),
    "url" text not null,
    raw_url text not null
  );

-- TODO: do not allow dupe URLs?
create table
  public.text_nodes (
    id uuid primary key,
    url_feed_id uuid not null references urls_feed,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    "url" text not null,
    title text not null,
    "text" text not null,
    embedding vector(384)
  );

create index 
  on text_nodes using hnsw (
    embedding vector_ip_ops
  );

create table
  public.text_node_chunks (
    id uuid primary key,
    text_node_id uuid not null references text_nodes,
    "text" text not null,
    embedding vector(384)
  );

create index 
  on text_node_chunks using hnsw (
    embedding vector_ip_ops
  );

create table 
  public.counter(
    count integer not null default 0
  );

insert into counter(count) values (0);

create or replace function update_counter()
returns integer 
language plpgsql
as $$
begin
  update counter set count = count + 1;
  return (select count from counter);
end;
$$;


create or replace function search_chunks (
  query_embedding vector(384),
  --match_threshold float,
  top_n int
)
returns table (
  id uuid,
  "text" text,
  "url" text,
  title text,
  score float
)
language sql stable
as $$
  select
    c.id,
    c.text,
    n.url,
    n.title,
    round(cast((c.embedding <#> query_embedding) * -1 as numeric), 3) as score
  from text_node_chunks as c
  join text_nodes as n on c.text_node_id = n.id
  --where n.embedding <=> query_embedding < 1 - match_threshold
  order by score desc
  limit top_n;
$$;

create or replace function search_pages (
  query_embedding vector(384),
  --match_threshold float,
  top_n int
)
returns table (
  id uuid,
  "url" text,
  title text,
  score float
)
language sql stable
as $$
  select
    n.id,
    n.url,
    n.title,
    round(cast((n.embedding <#> query_embedding) * -1 as numeric), 3) as score
  from text_nodes as n
  --where n.embedding <=> query_embedding < 1 - match_threshold
  order by score desc
  limit top_n;
$$;
