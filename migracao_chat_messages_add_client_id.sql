ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS client_id TEXT;

UPDATE public.chat_messages
SET client_id = id::text
WHERE client_id IS NULL;

ALTER TABLE public.chat_messages
  ALTER COLUMN client_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS chat_messages_client_id_key
ON public.chat_messages (client_id);

