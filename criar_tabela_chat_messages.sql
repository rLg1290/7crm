CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('ia','central')),
  text TEXT NOT NULL,
  ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc', now()),
  expire_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (timezone('utc', now()) + interval '48 hours')
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_ts ON public.chat_messages (usuario_id, ts);
CREATE INDEX IF NOT EXISTS idx_chat_messages_empresa_ts ON public.chat_messages (empresa_id, ts);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_messages_select
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    usuario_id = auth.uid() AND 
    empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE usuario_id = auth.uid())
  );

CREATE POLICY chat_messages_insert
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id = auth.uid() AND 
    empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE usuario_id = auth.uid())
  );

CREATE POLICY chat_messages_delete
  ON public.chat_messages
  FOR DELETE
  TO authenticated
  USING (
    usuario_id = auth.uid()
  );