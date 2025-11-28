create table if not exists content_favorite (
  user_id uuid not null,
  item_id bigint not null references content_item(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, item_id)
);

create table if not exists content_progress (
  user_id uuid not null,
  item_id bigint not null references content_item(id) on delete cascade,
  percent int not null default 0,
  last_watched_at timestamp with time zone default now(),
  primary key (user_id, item_id)
);

create table if not exists content_metrics (
  item_id bigint primary key references content_item(id) on delete cascade,
  views int not null default 0,
  favorites_count int not null default 0
);

alter table content_favorite enable row level security;
alter table content_progress enable row level security;
alter table content_metrics enable row level security;

create policy content_favorite_self on content_favorite
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy content_progress_self on content_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy content_metrics_read on content_metrics
  for select using (true);
