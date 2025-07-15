-- SOLUÇÃO DE EMERGÊNCIA: Desabilitar RLS temporariamente
-- Use apenas se as outras soluções não funcionarem

-- ⚠️  ATENÇÃO: Esta solução desabilita a segurança temporariamente
-- Teste apenas em ambiente de desenvolvimento

-- 1. Verificar estado atual do RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'empresas';

-- 2. Desabilitar RLS temporariamente
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;

-- 3. Confirmar que foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'empresas';

-- 4. Agora teste o salvamento da cor na interface
-- O botão "Salvar Cor" deve funcionar

-- 5. Teste manual para confirmar
UPDATE empresas 
SET cor_personalizada = '#FF6B6B' 
WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a';

-- 6. Verificar se funcionou
SELECT id, nome, cor_personalizada, updated_at
FROM empresas 
WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a';

-- 7. IMPORTANTE: Reabilitar RLS após confirmar que funciona
-- ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- 8. Se quiser reabilitar com política mais permissiva:
-- CREATE POLICY "empresas_update_all" ON empresas
-- FOR UPDATE 
-- USING (auth.uid() IS NOT NULL);

-- 9. Para uma solução mais segura, use:
-- CREATE POLICY "empresas_update_safe" ON empresas
-- FOR UPDATE 
-- USING (
--   auth.uid() IS NOT NULL 
--   AND 
--   EXISTS (
--     SELECT 1 FROM auth.users 
--     WHERE auth.users.id = auth.uid() 
--     AND (auth.users.raw_user_meta_data ->> 'empresa_id') = empresas.id::text
--   )
-- );

COMMENT ON TABLE empresas IS 'RLS temporariamente desabilitado para teste de salvamento de cor'; 