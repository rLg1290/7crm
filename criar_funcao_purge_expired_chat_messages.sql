CREATE OR REPLACE FUNCTION public.purge_expired_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.chat_messages
  WHERE usuario_id = auth.uid()
    AND expire_at < timezone('utc', now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_expired_chat_messages() TO authenticated;