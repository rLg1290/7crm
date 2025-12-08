create table if not exists public.product_updates (
  id uuid primary key default gen_random_uuid(),
  date date not null default now(),
  title text not null,
  summary text,
  type text default 'release',
  tags text[] default '{}'
);

