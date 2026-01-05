alter table public.funil_vendas
add column if not exists cidade_uf text,
add column if not exists tipo_agencia text,
add column if not exists nivel_demanda text,
add column if not exists produtos_interesse text[],
add column if not exists nivel_interesse text;
