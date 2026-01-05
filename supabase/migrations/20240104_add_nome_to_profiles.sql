alter table public.profiles 
add column if not exists nome text;

-- Atualizar nome baseado no email (placeholder inicial)
update public.profiles 
set nome = split_part(email, '@', 1) 
where nome is null;
