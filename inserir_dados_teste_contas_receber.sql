-- Script para inserir dados de teste na tabela contas_receber
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos pegar o ID da primeira empresa disponível
DO $$
DECLARE
    empresa_id_uuid UUID;
BEGIN
    -- Pegar o ID da primeira empresa
    SELECT id INTO empresa_id_uuid FROM empresas LIMIT 1;
    
    -- Se não houver empresa, criar uma
    IF empresa_id_uuid IS NULL THEN
        INSERT INTO empresas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, site, descricao)
        VALUES ('Empresa Teste', '12.345.678/0001-90', 'teste@empresa.com', '(11) 99999-9999', 'Rua Teste, 123', 'São Paulo', 'SP', '01234-567', 'www.empresa.com', 'Empresa para testes')
        RETURNING id INTO empresa_id_uuid;
    END IF;
    
    -- Inserir dados de teste na tabela contas_receber
    INSERT INTO contas_receber (
        empresa_id,
        cliente_id,
        cliente_nome,
        descricao,
        servico,
        valor,
        vencimento,
        status,
        observacoes
    ) VALUES 
    (
        empresa_id_uuid,
        NULL,
        'João Silva',
        'Pacote de viagem para Paris',
        'Hospedagem',
        2500.00,
        '2024-08-15',
        'pendente',
        'Pacote completo com hotel 4 estrelas'
    ),
    (
        empresa_id_uuid,
        NULL,
        'Maria Santos',
        'Passagem aérea São Paulo - Nova York',
        'Transporte',
        1800.00,
        '2024-08-20',
        'pendente',
        'Passagem executiva'
    ),
    (
        empresa_id_uuid,
        NULL,
        'Pedro Costa',
        'Seguro viagem Europa',
        'Seguros',
        350.00,
        '2024-08-10',
        'vencida',
        'Seguro anual para Europa'
    ),
    (
        empresa_id_uuid,
        NULL,
        'Ana Oliveira',
        'Pacote de viagem para Japão',
        'Hospedagem',
        4200.00,
        '2024-09-01',
        'pendente',
        'Pacote com guia local'
    ),
    (
        empresa_id_uuid,
        NULL,
        'Carlos Ferreira',
        'Passagem aérea Rio - Londres',
        'Transporte',
        2200.00,
        '2024-08-28',
        'pendente',
        'Passagem econômica'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Dados inseridos com empresa_id: %', empresa_id_uuid;
END $$;

-- Verificar se os dados foram inseridos
SELECT 
    'Dados inseridos:' as info,
    COUNT(*) as total_registros
FROM contas_receber;

-- Mostrar os dados inseridos
SELECT 
    id,
    empresa_id,
    cliente_nome,
    descricao,
    servico,
    valor,
    vencimento,
    status,
    created_at
FROM contas_receber
ORDER BY created_at DESC; 