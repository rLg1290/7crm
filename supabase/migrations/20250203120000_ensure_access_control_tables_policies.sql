-- Ensure users can read their own company links in usuarios_empresas
-- This is critical because other RLS policies (like contas_pagar) depend on querying this table.

-- 1. Enable RLS (just in case)
ALTER TABLE usuarios_empresas ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own company links" ON usuarios_empresas;

-- 3. Create SELECT policy
CREATE POLICY "Users can view their own company links"
ON usuarios_empresas FOR SELECT
USING (
  usuario_id = auth.uid()
);

-- 4. Also ensure profiles is readable (usually is, but good to be safe)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
-- Note: profiles usually has public read or own read. Let's ensure own read at minimum.
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (
  id = auth.uid()
);
