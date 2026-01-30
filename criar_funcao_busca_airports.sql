create extension if not exists unaccent;

create or replace function public.search_airports(term text, limit_rows int default 8)
returns table (id bigint, name text, iata_code text, municipality text, iso_country text)
language sql
stable
as $$
  select a.id, a.name, a.iata_code, a.municipality, a.iso_country
  from public.airports a
  where a.iata_code is not null
    and a.iso_country = 'BR' -- Filtro apenas aeroportos brasileiros
    and (
      unaccent(lower(a.name)) like '%' || unaccent(lower(term)) || '%'
      or unaccent(lower(a.municipality)) like '%' || unaccent(lower(term)) || '%'
      or lower(a.iata_code) like '%' || lower(term) || '%'
    )
  order by case when lower(a.iata_code) = lower(term) then 0 else 1 end, a.iata_code
  limit limit_rows;
$$;

grant execute on function public.search_airports(text, int) to authenticated;

