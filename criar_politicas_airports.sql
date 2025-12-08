alter table public.airports enable row level security;

drop policy if exists "airports select authenticated" on public.airports;
create policy "airports select authenticated"
on public.airports
for select
to authenticated
using (true);

