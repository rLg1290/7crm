# Instruções para Criar Tabela Leads

## 1. Execute o SQL no Supabase

Acesse o painel do Supabase e execute o seguinte SQL no SQL Editor:

```sql
-- Criar tabela leads
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar RLS (Row Level Security) se necessário
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total (ajuste conforme suas necessidades de segurança)
CREATE POLICY "Permitir acesso total aos leads" ON leads
  FOR ALL USING (true);

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO leads (cliente_id, observacao) VALUES
  ((SELECT id FROM clientes LIMIT 1), 'Interessado em viagem para Europa em julho'),
  ((SELECT id FROM clientes LIMIT 1 OFFSET 1), 'Quer conhecer Nova York no final do ano');
```

## 2. Funcionalidades Implementadas

Após executar o SQL, o sistema terá as seguintes funcionalidades:

### Coluna LEAD
- Mostra leads (não cotações)
- Botão "Novo Lead" para criar leads
- Leads são armazenados na tabela `leads`

### Conversão de Lead para Cotação
- Ao arrastar um lead para a coluna "COTAR":
  - O lead é removido da tabela `leads`
  - Uma nova cotação é criada na tabela `cotacoes`
  - A observação do lead vira observação da cotação
  - Status inicial da cotação: "COTAR"

### Fluxo de Criação de Lead
1. Clicar em "Novo Lead" na coluna LEAD
2. Selecionar cliente existente ou criar novo
3. Adicionar observação sobre a viagem desejada
4. Salvar lead

### Restrições
- Leads só podem ser movidos para "COTAR"
- Tentar mover para outras colunas mostra alerta
- Leads não têm valor (sempre R$ 0,00)

## 3. Próximos Passos

1. Execute o SQL no Supabase
2. Teste a criação de leads
3. Teste o drag & drop de lead para "COTAR"
4. Verifique se a conversão está funcionando corretamente 