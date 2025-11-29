UPDATE public.clientes
SET nome = trim(concat_ws(' ', nome, sobrenome)),
    sobrenome = NULL
WHERE true;