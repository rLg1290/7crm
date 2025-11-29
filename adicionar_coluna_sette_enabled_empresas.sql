ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS sette_enabled boolean DEFAULT false;
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS chat_enabled boolean DEFAULT true;
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS sette_visible boolean DEFAULT true;
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS central_visible boolean DEFAULT true;