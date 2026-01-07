alter table public.funil_vendas
add column if not exists razao_social text,
add column if not exists cnpj text,
add column if not exists endereco text,
add column if not exists tipo_empresa text,
add column if not exists nome_socio_administrador text,
add column if not exists cpf_administrador text,
add column if not exists relatorio_reuniao text;
