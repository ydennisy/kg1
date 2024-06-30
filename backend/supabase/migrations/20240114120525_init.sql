create extension vector;

create type
  url_status as enum (
    'RECEIVED_AWAITING_INDEXING',
    'INDEXED_SUCCESSFULLY',
    'INDEXING_FAILED',
    'INDEXING_SKIPPED_AS_DUPLICATE'
  );

create type
  url_source as enum (
    'WEB',
    'EMAIL'
  );

create table
  public.urls_feed (
    id uuid primary key,
    user_id uuid not null,
    status url_status,
    created_at timestamptz not null default now(),
    "url" varchar not null,
    raw_url varchar not null,
    source url_source
  );

alter table urls_feed enable row level security;

create index
  on urls_feed (
    user_id
  );

create table
  public.text_nodes (
    id uuid primary key,
    user_id uuid not null,
    url_feed_id uuid not null references urls_feed,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    "url" text not null,
    title text not null,
    "text" text not null,
    summary text not null,
    fts tsvector generated always as (to_tsvector('english', "text")) stored,
    embedding vector(256)
  );

alter table text_nodes add constraint unique_url unique (url);
alter table text_nodes enable row level security;

create index
  on text_nodes (
    user_id
  );

-- Create an index for the full-text search
create index
  on text_nodes using gin(
    fts
  );

-- Create an index for the semantic vector search
create index 
  on text_nodes using hnsw (
    embedding vector_ip_ops
  );

create table
  public.text_node_chunks (
    id uuid primary key,
    user_id uuid not null,
    text_node_id uuid not null references text_nodes,
    "text" text not null,
    embedding vector(256)
  );

alter table text_node_chunks enable row level security;

create index
  on text_node_chunks (
    user_id
  );

create index 
  on text_node_chunks using hnsw (
    embedding vector_ip_ops
  );

create table 
  public.usage_counter(
    id text primary key,
    count integer not null default 0
  );

alter table usage_counter enable row level security;

insert into usage_counter(id, count) values ('openai-api', 0);

create or replace function update_usage_counter()
returns integer 
language plpgsql
as $$
begin
  update usage_counter set count = count + 1 where id = 'openai-api';
  return (select count from usage_counter where id = 'openai-api');
end;
$$;


create or replace function search_text_node_chunks (
  query_embedding vector(256),
  user_id_filter uuid,
  threshold float default 0.5,
  top_n int default 10
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
  with ranked as (
    select
      c.id,
      c.text,
      n.url,
      n.title,
      round(cast((c.embedding <#> query_embedding) * -1 as numeric), 3) as score
    from text_node_chunks as c
    join text_nodes as n on c.text_node_id = n.id
    where n.user_id = user_id_filter
    order by score desc
  )

  select *
  from ranked
  where score >= threshold
  limit top_n;
$$;

create or replace function search_text_nodes (
  query_embedding vector(256),
  user_id_filter uuid,
  threshold float default 0.5,
  top_n int default 10
)
returns table (
  id uuid,
  "url" text,
  title text,
  score float
)
language sql stable
as $$
  with ranked as (
    select
      id,
      url,
      title,
      round(cast((embedding <#> query_embedding) * -1 as numeric), 3) as score
    from text_nodes
    where user_id = user_id_filter
    order by score desc
  )

  select *
  from ranked
  where score >= threshold
  limit top_n;
$$;

create or replace function hybrid_search_text_nodes(
  query_text text,
  query_embedding vector(256),
  match_count int,
  full_text_weight float = 1,
  semantic_weight float = 1,
  rrf_k int = 50
)
returns table (
  id uuid,
  "url" text,
  title text,
  score float
)
language sql
as $$
with full_text as (
  select
    id,
    -- Note: ts_rank_cd is not indexable but will only rank matches of the where clause
    -- which shouldn't be too big
    row_number() over(order by ts_rank_cd(fts, websearch_to_tsquery(query_text)) desc) as rank_ix
  from
    text_nodes
  where
    fts @@ websearch_to_tsquery(query_text)
  order by rank_ix
  limit least(match_count, 30) * 2
),
semantic as (
  select
    id,
    row_number() over (order by embedding <#> query_embedding) as rank_ix
  from
    text_nodes
  order by rank_ix
  limit least(match_count, 30) * 2
)
select
  text_nodes.id,
  text_nodes.url,
  text_nodes.title,
  coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
  coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight as score
from
  full_text
  full outer join semantic
    on full_text.id = semantic.id
  join text_nodes
    on coalesce(full_text.id, semantic.id) = text_nodes.id
order by score desc
limit
  least(match_count, 30)
$$;
