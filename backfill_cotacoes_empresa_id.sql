UPDATE public.cotacoes AS c
SET empresa_id = cl.empresa_id
FROM public.clientes AS cl
WHERE c.empresa_id IS NULL
  AND c.cliente_id = cl.id
  AND cl.empresa_id IS NOT NULL;

