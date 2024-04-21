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
    user_id uuid not null,
    status url_status,
    created_at timestamp with time zone not null default now(),
    "url" text not null,
    raw_url text not null
  );

create index
  on urls_feed (
    user_id
  );

-- TODO: do not allow dupe URLs?
create table
  public.text_nodes (
    id uuid primary key,
    user_id uuid not null,
    url_feed_id uuid not null references urls_feed,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    "url" text not null,
    title text not null,
    "text" text not null,
    summary text not null,
    embedding vector(256)
  );

create index
  on text_nodes (
    user_id
  );

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


create or replace function search_chunks (
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

create or replace function search_pages (
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
