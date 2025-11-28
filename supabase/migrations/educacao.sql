-- Tabelas de Educação: categorias, itens e associação
create table if not exists content_category (
  id bigserial primary key,
  name text not null,
  slug text not null,
  type text not null,
  parent_id bigint references content_category(id) on delete set null,
  path text generated always as (case when parent_id is null then slug else null end) stored,
  order_index int default 0,
  empresa_id uuid,
  created_at timestamp with time zone default now()
);

create unique index if not exists uq_content_category_slug_parent on content_category(slug, parent_id);
create index if not exists idx_content_category_parent on content_category(parent_id);

create table if not exists content_item (
  id bigserial primary key,
  title text not null,
  type text not null check (type in ('live','video')),
  youtube_url text not null,
  youtube_id text not null,
  description text,
  published_at timestamp with time zone,
  duration_seconds int,
  published boolean default false,
  empresa_id uuid,
  created_by uuid,
  created_at timestamp with time zone default now()
);

create index if not exists idx_content_item_type_pub on content_item(type, published_at desc);
create index if not exists idx_content_item_published on content_item(published);

create table if not exists content_item_category (
  content_item_id bigint references content_item(id) on delete cascade,
  category_id bigint references content_category(id) on delete cascade,
  primary key (content_item_id, category_id)
);

create index if not exists idx_content_item_category_cat on content_item_category(category_id);

-- Políticas RLS (exemplos; ajustar conforme perfis/empresas do projeto)
alter table content_category enable row level security;
alter table content_item enable row level security;
alter table content_item_category enable row level security;

-- Seleção pública opcional de itens publicados
create policy content_item_select_published on content_item
  for select using (published = true);

-- Seleção autenticada para parceiros/usuários/admin (ajuste conforme tabela profiles)
create policy content_item_select_auth on content_item
  for select using (auth.uid() is not null);

-- Escrita restrita a admins
create policy content_item_write_admin on content_item
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy content_category_select_auth on content_category
  for select using (auth.uid() is not null);

create policy content_category_write_admin on content_category
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy content_item_category_select_auth on content_item_category
  for select using (auth.uid() is not null);

create policy content_item_category_write_admin on content_item_category
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Seeds opcionais: criar raiz Lives e Videos se não existirem
insert into content_category (name, slug, type, parent_id)
  select 'Lives', 'lives', 'Lives', null
  where not exists (select 1 from content_category where slug = 'lives' and parent_id is null);

insert into content_category (name, slug, type, parent_id)
  select 'Videos', 'videos', 'Videos', null
  where not exists (select 1 from content_category where slug = 'videos' and parent_id is null);
