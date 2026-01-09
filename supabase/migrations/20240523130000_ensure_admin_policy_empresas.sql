
DO $$
BEGIN
    -- Drop existing policy if it might conflict (optional, but safer to just add a new permissive one or replace)
    -- But since we don't know the name, we'll just add a new one that ensures admins can do everything.
    -- Postgres policies are OR'ed together (permissive).
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'empresas' 
        AND policyname = 'Admins can do everything on empresas'
    ) THEN
        CREATE POLICY "Admins can do everything on empresas"
        ON public.empresas
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );
    END IF;
END $$;
