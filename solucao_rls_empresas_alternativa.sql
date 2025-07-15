-- Solução Alternativa: RLS mais simples para empresas
-- Este script resolve o erro de conversão de tipos UUID = text

-- 1. Primeiro, vamos remover qualquer política existente
DROP POLICY IF EXISTS "Usuários podem atualizar sua empresa" ON empresas;
DROP POLICY IF EXISTS "update_empresa_policy" ON empresas;
DROP POLICY IF EXISTS "Users can update their company" ON empresas;
DROP POLICY IF EXISTS "empresas_update_policy" ON empresas;

-- 2. Verificar se a coluna id é realmente UUID
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'empresas' AND column_name = 'id';

-- 3. Política mais simples e robusta
CREATE POLICY "empresas_update_policy" ON empresas
FOR UPDATE 
USING (
  -- Permitir update para usuários autenticados da própria empresa
  auth.uid() IS NOT NULL 
  AND 
  id::text = (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
);

-- 4. Verificar se a política foi criada
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'empresas' AND cmd = 'UPDATE';

-- 5. Garantir permissões básicas
GRANT UPDATE ON empresas TO authenticated;

-- 6. Se ainda não funcionar, política ainda mais permissiva (temporária)
-- Descomente apenas se necessário:
-- CREATE POLICY "empresas_update_temp" ON empresas
-- FOR UPDATE 
-- USING (auth.uid() IS NOT NULL);

-- 7. Teste manual (substitua o ID pela empresa real)
-- UPDATE empresas 
-- SET cor_personalizada = '#00FF00' 
-- WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a';

-- 8. Verificar resultado
-- SELECT id, nome, cor_personalizada 
-- FROM empresas 
-- WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a';

COMMENT ON POLICY "empresas_update_policy" ON empresas IS 'Permite updates na empresa do usuário autenticado'; 