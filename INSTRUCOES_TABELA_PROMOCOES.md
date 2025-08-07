# Tabela de Promoções - Instruções de Implementação

## Visão Geral
Este documento descreve a implementação da tabela `promocoes` que será utilizada para alimentar o sistema de promoções do CRM.

## Estrutura da Tabela

### Campos Principais
- **destino** (VARCHAR(255)): Nome do destino da promoção (ex: "Paris", "Rio de Janeiro")
- **valor_de** (DECIMAL(10,2)): Valor original/preço "de" 
- **valor_por** (DECIMAL(10,2)): Valor promocional/preço "por"
- **tipo** (VARCHAR(50)): Tipo da promoção (ex: "Aéreo", "Hotel", "Pacote")

### Campos Adicionais
- **id** (UUID): Identificador único da promoção
- **empresa_id** (UUID): ID da empresa proprietária (referência à tabela empresas)
- **ativo** (BOOLEAN): Status da promoção (ativa/inativa)
- **data_inicio** (DATE): Data de início da promoção
- **data_fim** (DATE): Data de fim da promoção
- **descricao** (TEXT): Descrição adicional da promoção
- **imagem_url** (TEXT): URL da imagem da promoção
- **created_at** (TIMESTAMP): Data de criação
- **updated_at** (TIMESTAMP): Data da última atualização

## Instruções de Execução

### 1. Executar o Script SQL
```sql
-- Execute o arquivo criar_tabela_promocoes.sql no Supabase
```

### 2. Verificar a Criação
Após executar o script, verifique se a tabela foi criada corretamente:
```sql
SELECT * FROM promocoes LIMIT 5;
```

### 3. Inserir Dados de Teste (Opcional)
```sql
INSERT INTO promocoes (empresa_id, destino, valor_de, valor_por, tipo, descricao) VALUES
('sua-empresa-id-aqui', 'Paris', 2500.00, 1899.00, 'Aéreo', 'Passagem aérea para Paris com desconto especial'),
('sua-empresa-id-aqui', 'Rio de Janeiro', 800.00, 599.00, 'Hotel', 'Hotel 4 estrelas em Copacabana'),
('sua-empresa-id-aqui', 'Cancún', 3200.00, 2499.00, 'Pacote', 'Pacote completo para Cancún com hotel e voos');
```

## Funcionalidades Implementadas

### Segurança (RLS)
- ✅ Row Level Security habilitado
- ✅ Política para que cada empresa veja apenas suas promoções
- ✅ Referência à tabela empresas com CASCADE DELETE

### Performance
- ✅ Índices criados para campos frequentemente consultados
- ✅ Índice composto para consultas por data

### Automação
- ✅ Trigger para atualização automática do campo `updated_at`
- ✅ Geração automática de UUID para novos registros

## Integração com o Sistema Atual

### Página de Promoções
A tabela se integra com a página `src/pages/Promocoes.tsx` que já possui:
- ✅ Sistema de cores personalizadas (`cor_primaria`, `cor_secundaria`)
- ✅ Geração de imagens promocionais
- ✅ Templates visuais

### Próximos Passos
1. **Interface de Gerenciamento**: Criar página para CRUD das promoções
2. **Integração com Canvas**: Conectar os dados da tabela com a geração de imagens
3. **Filtros e Busca**: Implementar filtros por tipo, data e status
4. **Upload de Imagens**: Sistema para upload de imagens das promoções

## Tipos de Promoção Sugeridos
- **Aéreo**: Passagens aéreas
- **Hotel**: Hospedagem
- **Pacote**: Pacotes completos (voo + hotel)
- **Cruzeiro**: Cruzeiros marítimos
- **Excursão**: Excursões e passeios
- **Seguro**: Seguros de viagem

## Exemplo de Uso

```sql
-- Buscar promoções ativas de uma empresa
SELECT * FROM promocoes 
WHERE empresa_id = 'uuid-da-empresa' 
AND ativo = true 
AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
ORDER BY created_at DESC;

-- Buscar promoções por tipo
SELECT * FROM promocoes 
WHERE tipo = 'Aéreo' 
AND ativo = true;

-- Calcular desconto percentual
SELECT 
    destino,
    valor_de,
    valor_por,
    ROUND(((valor_de - valor_por) / valor_de * 100), 2) as desconto_percentual
FROM promocoes 
WHERE ativo = true;
```

## Observações Importantes

1. **Empresa ID**: Certifique-se de usar o UUID correto da empresa ao inserir dados
2. **Datas**: As datas são opcionais, permitindo promoções sem prazo definido
3. **Valores**: Use sempre 2 casas decimais para os valores monetários
4. **Imagens**: O campo `imagem_url` pode armazenar URLs do Supabase Storage ou externos

## Arquivos Relacionados
- `criar_tabela_promocoes.sql` - Script de criação da tabela
- `src/pages/Promocoes.tsx` - Página de visualização das promoções
- `adicionar_campo_cor_primaria.sql` - Script para cores personalizadas