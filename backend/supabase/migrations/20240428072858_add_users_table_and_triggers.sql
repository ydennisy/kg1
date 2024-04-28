create extension if not exists pgcrypto;

-- Create a simple table to house user.
create table
  public.users (
    id uuid not null references auth.users on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    email varchar not null,
    app_email_alias varchar not null,

    primary key (id),
    unique(app_email_alias)
  );

alter table public.users enable row level security;

-- Create a function to create a new user
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer set search_path = public
as $$
begin
  insert into public.users(id, email, app_email_alias)
  values (
    new.id,
    new.email,
    substring(md5(random()::text), 1, 8)
  );
  return new;
end;
$$;

-- Create a trigger to run each time we insert into auth.users
create trigger handle_new_user_trigger
after insert on auth.users
for each row
execute procedure public.handle_new_user();
