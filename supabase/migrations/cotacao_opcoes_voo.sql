create table if not exists cotacao_opcoes_voo (
  id bigserial primary key,
  cotacao_id bigint not null,
  titulo text not null,
  trecho text,
  is_preferida boolean default false,
  status text default 'ativo',
  preco_total numeric(12,2) not null default 0,
  moeda text default 'BRL',
  valido_ate date,
  observacoes text,
  created_at timestamp with time zone default now()
);
alter table cotacao_opcoes_voo add column if not exists trecho text;

create table if not exists cotacao_opcao_segmentos (
  id bigserial primary key,
  opcao_id bigint not null references cotacao_opcoes_voo(id) on delete cascade,
  ordem int not null default 1,
  cia text,
  numero_voo text,
  origem text,
  destino text,
  partida timestamp with time zone,
  chegada timestamp with time zone,
  franquia_bagagem text,
  classe_tarifaria text,
  fare_rules text
);

alter table cotacao_opcoes_voo enable row level security;
alter table cotacao_opcao_segmentos enable row level security;
drop policy if exists cotacao_opcoes_voo_select on cotacao_opcoes_voo;
create policy cotacao_opcoes_voo_select on cotacao_opcoes_voo for select using (true);
drop policy if exists cotacao_opcoes_voo_write on cotacao_opcoes_voo;
create policy cotacao_opcoes_voo_write on cotacao_opcoes_voo for all using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists cotacao_opcao_segmentos_select on cotacao_opcao_segmentos;
create policy cotacao_opcao_segmentos_select on cotacao_opcao_segmentos for select using (true);
drop policy if exists cotacao_opcao_segmentos_write on cotacao_opcao_segmentos;
create policy cotacao_opcao_segmentos_write on cotacao_opcao_segmentos for all using (auth.uid() is not null) with check (auth.uid() is not null);

create index if not exists idx_cotacao_opcoes_voo_cotacao on cotacao_opcoes_voo(cotacao_id);
create index if not exists idx_cotacao_opcoes_voo_cotacao_trecho on cotacao_opcoes_voo(cotacao_id, trecho);
create index if not exists idx_cotacao_opcoes_voo_preferida on cotacao_opcoes_voo(cotacao_id, is_preferida);
create index if not exists idx_segmentos_opcao on cotacao_opcao_segmentos(opcao_id);

-- Persistência do preço diretamente no voo
alter table if exists voos add column if not exists preco_opcao numeric(12,2) default 0;

-- Vínculo da opção com o voo (para exibir/editar conexões por cartão de voo)
alter table if exists cotacao_opcoes_voo add column if not exists voo_id bigint references voos(id) on delete cascade;
create index if not exists idx_cotacao_opcoes_voo_voo on cotacao_opcoes_voo(voo_id);
