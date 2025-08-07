# Instruções para Adicionar Campo Imagem às Promoções

## Visão Geral
Este documento contém as instruções para adicionar o campo `imagem` à tabela `promocoes` no Supabase.

## Pré-requisitos
- Acesso ao painel do Supabase
- Permissões para executar comandos SQL

## Passos para Implementação

### 1. Acessar o SQL Editor
1. Faça login no [Supabase](https://supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral

### 2. Executar o Script
1. Abra o arquivo `adicionar_campo_imagem_promocoes.sql`
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** para executar

### 3. Verificar a Implementação
Após executar o script, você deve ver:
- ✅ Campo `imagem` adicionado à tabela `promocoes`
- ✅ Comentário do campo configurado
- ✅ Consulta de verificação retornando o novo campo

## Funcionalidades Implementadas

### No Frontend (Promocoes.tsx)
- ✅ Campo de entrada para URL da imagem no modal de criação
- ✅ Salvamento do campo imagem no banco de dados
- ✅ Carregamento das promoções do banco de dados
- ✅ Exibição das imagens nas promoções
- ✅ Fallback para imagem padrão quando não informada

### No Backend (Supabase)
- ✅ Campo `imagem` do tipo TEXT na tabela `promocoes`
- ✅ Integração com RLS (Row Level Security)
- ✅ Comentários de documentação

## Estrutura Final da Tabela

```sql
CREATE TABLE promocoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    destino VARCHAR(255) NOT NULL,
    valor_de DECIMAL(10,2) NOT NULL,
    valor_por DECIMAL(10,2) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    observacoes TEXT,
    imagem TEXT,  -- NOVO CAMPO
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Uso do Campo Imagem

- **Formato**: URL completa da imagem (ex: `https://exemplo.com/imagem.jpg`)
- **Opcional**: Campo pode ser deixado em branco
- **Fallback**: Quando vazio, usa imagem padrão do Picsum
- **Suporte**: Aceita URLs de qualquer serviço de hospedagem de imagens

## Próximos Passos

1. Execute o script SQL no Supabase
2. Teste a criação de promoções com e sem imagem
3. Verifique se as imagens são exibidas corretamente
4. Confirme que as promoções são salvas e carregadas do banco de dados

## Solução de Problemas

### Erro ao executar o script
- Verifique se você tem permissões de administrador
- Confirme se a tabela `promocoes` existe
- Verifique se não há conflitos de nomes

### Campo não aparece
- Recarregue a página do Supabase
- Verifique na aba **Table Editor** se o campo foi criado
- Execute a query de verificação manualmente

### Imagens não carregam
- Verifique se as URLs das imagens são válidas
- Confirme se as imagens são acessíveis publicamente
- Teste com uma URL de imagem conhecida