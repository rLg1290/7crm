-- Script para verificar e corrigir a tabela leads
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela leads existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
        RAISE NOTICE 'Tabela leads não existe. Criando...';
        
        -- Criar a tabela leads
        CREATE TABLE leads (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
            cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            telefone VARCHAR(20),
            origem VARCHAR(100),
            status VARCHAR(50) DEFAULT 'novo',
            observacoes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices para melhor performance
        CREATE INDEX idx_leads_empresa_id ON leads(empresa_id);
        CREATE INDEX idx_leads_cliente_id ON leads(cliente_id);
        CREATE INDEX idx_leads_status ON leads(status);
        CREATE INDEX idx_leads_created_at ON leads(created_at);
        
        -- Habilitar RLS (Row Level Security)
        ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas RLS
        -- Política para permitir acesso aos leads da empresa
        CREATE POLICY "Usuários podem ver leads da sua empresa" ON leads
            FOR SELECT USING (
                empresa_id IN (
                    SELECT empresa_id FROM usuarios_empresas 
                    WHERE usuario_id = auth.uid()
                )
            );
        
        -- Política para inserção
        CREATE POLICY "Usuários podem inserir leads na sua empresa" ON leads
            FOR INSERT WITH CHECK (
                empresa_id IN (
                    SELECT empresa_id FROM usuarios_empresas 
                    WHERE usuario_id = auth.uid()
                )
            );
        
        -- Política para atualização
        CREATE POLICY "Usuários podem atualizar leads da sua empresa" ON leads
            FOR UPDATE USING (
                empresa_id IN (
                    SELECT empresa_id FROM usuarios_empresas 
                    WHERE usuario_id = auth.uid()
                )
            );
        
        -- Política para exclusão
        CREATE POLICY "Usuários podem excluir leads da sua empresa" ON leads
            FOR DELETE USING (
                empresa_id IN (
                    SELECT empresa_id FROM usuarios_empresas 
                    WHERE usuario_id = auth.uid()
                )
            );
        
        RAISE NOTICE 'Tabela leads criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela leads já existe.';
    END IF;
END $$;

-- 2. Verificar se há leads na tabela
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'novo' THEN 1 END) as leads_novos,
    COUNT(CASE WHEN status = 'contatado' THEN 1 END) as leads_contatados,
    COUNT(CASE WHEN status = 'convertido' THEN 1 END) as leads_convertidos
FROM leads;

-- 3. Se não há leads, inserir alguns de exemplo
INSERT INTO leads (empresa_id, nome, email, telefone, origem, status, observacoes)
SELECT 
    e.id as empresa_id,
    v.nome,
    v.email,
    v.telefone,
    v.origem,
    v.status,
    v.observacoes
FROM (
    VALUES
        ('João Silva', 'joao.silva@email.com', '(11) 99999-1111', 'Website', 'novo', 'Cliente interessado em pacote para Europa'),
        ('Maria Santos', 'maria.santos@email.com', '(11) 99999-2222', 'Indicação', 'contatado', 'Aguardando retorno sobre orçamento'),
        ('Pedro Costa', 'pedro.costa@email.com', '(11) 99999-3333', 'Redes Sociais', 'novo', 'Interesse em viagem de lua de mel'),
        ('Ana Oliveira', 'ana.oliveira@email.com', '(11) 99999-4444', 'Google Ads', 'convertido', 'Pacote vendido - Caribe'),
        ('Carlos Ferreira', 'carlos.ferreira@email.com', '(11) 99999-5555', 'Website', 'novo', 'Consulta sobre passagens aéreas'),
        ('Lucia Pereira', 'lucia.pereira@email.com', '(11) 99999-6666', 'Indicação', 'contatado', 'Orçamento enviado - aguardando confirmação'),
        ('Roberto Lima', 'roberto.lima@email.com', '(11) 99999-7777', 'Redes Sociais', 'novo', 'Interesse em cruzeiro'),
        ('Fernanda Rocha', 'fernanda.rocha@email.com', '(11) 99999-8888', 'Google Ads', 'convertido', 'Pacote vendido - Disney'),
        ('Marcos Alves', 'marcos.alves@email.com', '(11) 99999-9999', 'Website', 'novo', 'Consulta sobre hotéis em Paris'),
        ('Juliana Souza', 'juliana.souza@email.com', '(11) 99999-0000', 'Indicação', 'contatado', 'Aguardando documentos para reserva')
) AS v(nome, email, telefone, origem, status, observacoes)
CROSS JOIN empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM leads 
    WHERE leads.nome = v.nome AND leads.email = v.email
)
LIMIT 10;

-- 4. Verificar resultado final
SELECT 
    'Leads após correção:' as status,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'novo' THEN 1 END) as leads_novos,
    COUNT(CASE WHEN status = 'contatado' THEN 1 END) as leads_contatados,
    COUNT(CASE WHEN status = 'convertido' THEN 1 END) as leads_convertidos
FROM leads;

-- 5. Mostrar alguns leads de exemplo
SELECT 
    l.id,
    l.nome,
    l.email,
    l.telefone,
    l.origem,
    l.status,
    l.observacoes,
    e.nome as empresa_nome,
    l.created_at
FROM leads l
LEFT JOIN empresas e ON l.empresa_id = e.id
ORDER BY l.created_at DESC
LIMIT 10; 