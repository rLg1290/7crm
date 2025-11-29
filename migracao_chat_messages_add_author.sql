ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS author TEXT;

UPDATE public.chat_messages
SET author = 'user'
WHERE author IS NULL;

ALTER TABLE public.chat_messages
  ALTER COLUMN author SET NOT NULL;

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_author_chk CHECK (author IN ('user','ia','central'));