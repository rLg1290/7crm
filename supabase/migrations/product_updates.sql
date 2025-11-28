create table if not exists product_updates (
  id bigserial primary key,
  title text not null,
  date date not null,
  type text not null,
  summary text not null,
  tags text[] default '{}',
  created_by uuid,
  created_at timestamp with time zone default now()
);

alter table product_updates enable row level security;

create policy product_updates_select_public on product_updates
  for select using (true);

create policy product_updates_write_admin on product_updates
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
