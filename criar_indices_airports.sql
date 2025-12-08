create extension if not exists pg_trgm;

create index if not exists airports_iata_code_idx on public.airports (iata_code);
create index if not exists airports_name_trgm_idx on public.airports using gin (name gin_trgm_ops);
create index if not exists airports_municipality_trgm_idx on public.airports using gin (municipality gin_trgm_ops);

