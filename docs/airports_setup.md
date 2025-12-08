# Airports: Configuração e Busca

## Variáveis de Ambiente

- Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente (Dev/Preview/Production).
- Em Vercel, configure essas variáveis em Project → Settings → Environment Variables e redeploy.

## Políticas RLS

- Execute `criar_politicas_airports.sql` no Supabase para habilitar RLS e permitir `SELECT` para usuários autenticados.

## Índices de Busca

- Execute `criar_indices_airports.sql` para habilitar `pg_trgm` e criar índices:
  - BTree em `iata_code`.
  - GIN Trigram em `name` e `municipality`.

## Teste de Busca

```sql
select id, name, iata_code, municipality, iso_country
from public.airports
where (name ilike '%rio%' or iata_code ilike '%gig%' or municipality ilike '%rio%')
and iata_code is not null
limit 10;
```

## Frontend

- O autocomplete em `src/pages/Aereo.tsx` consulta `airports` com `ilike` e limita 8 resultados.
- Se o Supabase não estiver configurado, usa uma lista local mínima apenas para não quebrar UX. Com as variáveis definidas e RLS/índices aplicados, o frontend passa a usar exclusivamente o banco.

