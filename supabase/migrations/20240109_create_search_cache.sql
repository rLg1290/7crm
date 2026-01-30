create table if not exists public.user_search_cache (
  user_id uuid references auth.users not null,
  key text not null,
  data jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  primary key (user_id, key)
);

alter table public.user_search_cache enable row level security;

create policy "Users can view their own search cache"
  on public.user_search_cache for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own search cache"
  on public.user_search_cache for all
  using (auth.uid() = user_id);
