-- Script simples para corrigir a tabela leads
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 'Tabela leads existe:' as status, 
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public'
         AND table_name = 'leads'
       ) as existe;

-- 2. Se a tabela não existe, criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
        CREATE TABLE leads (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            telefone VARCHAR(20),
            origem VARCHAR(100),
            status VARCHAR(50) DEFAULT 'novo',
            observacoes TEXT,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas RLS
        CREATE POLICY "Usuários podem ver seus próprios leads" ON leads
            FOR SELECT USING (
                user_id = auth.uid()
            );
            
        CREATE POLICY "Usuários podem inserir seus próprios leads" ON leads
            FOR INSERT WITH CHECK (
                user_id = auth.uid()
            );
            
        CREATE POLICY "Usuários podem atualizar seus próprios leads" ON leads
            FOR UPDATE USING (
                user_id = auth.uid()
            );
            
        CREATE POLICY "Usuários podem deletar seus próprios leads" ON leads
            FOR DELETE USING (
                user_id = auth.uid()
            );
            
        RAISE NOTICE 'Tabela leads criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela leads já existe.';
    END IF;
END $$;

-- 3. Verificar se há dados na tabela
SELECT COUNT(*) as total_leads FROM leads;

-- 4. Se não há dados, inserir leads de exemplo
DO $$
DECLARE
    lead_count INTEGER;
    current_user_id UUID;
BEGIN
    SELECT COUNT(*) INTO lead_count FROM leads;
    
    -- Buscar um usuário de exemplo (se houver)
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    IF lead_count = 0 THEN
        -- Inserir leads de exemplo (sem empresa_id)
        INSERT INTO leads (nome, email, telefone, origem, status, observacoes, user_id) VALUES
        ('João Silva', 'joao.silva@email.com', '(11) 99999-1111', 'Website', 'novo', 'Interessado em pacote para Europa', current_user_id),
        ('Maria Santos', 'maria.santos@email.com', '(11) 99999-2222', 'Indicação', 'contato', 'Quer viajar para Disney', current_user_id),
        ('Pedro Costa', 'pedro.costa@email.com', '(11) 99999-3333', 'Redes Sociais', 'proposta', 'Interessado em lua de mel', current_user_id),
        ('Ana Oliveira', 'ana.oliveira@email.com', '(11) 99999-4444', 'Telefone', 'fechado', 'Pacote para Nova York fechado', current_user_id),
        ('Carlos Ferreira', 'carlos.ferreira@email.com', '(11) 99999-5555', 'Email', 'novo', 'Consulta sobre passagens aéreas', current_user_id);
        
        RAISE NOTICE 'Leads de exemplo inseridos com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela já possui % leads.', lead_count;
    END IF;
END $$;

-- 5. Verificar resultado final
SELECT 
    id,
    nome,
    email,
    telefone,
    origem,
    status,
    created_at
FROM leads 
ORDER BY created_at DESC; 