
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'aereo_enabled') THEN
        ALTER TABLE public.empresas ADD COLUMN aereo_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
