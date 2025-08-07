# Solução para Problema de Salvamento do Campo Custo

## Problema Identificado
O campo `custo` não estava sendo salvo corretamente na planilha/banco de dados.

## Análise Realizada

### 1. Verificação da Função salvarCotacao
- ✅ O campo `custo` está sendo incluído corretamente no objeto `cotacaoData`
- ✅ A lógica condicional está funcionando:
  - Se status = 'APROVADO': usa `calcularTotalCusto()`
  - Caso contrário: usa `parseFloat(valorCustoSimples)`

### 2. Verificação do Carregamento de Dados
- ✅ Na função `handleEditCotacao`, o campo `custo` é carregado corretamente:
  ```typescript
  setValorCustoSimples(cotacao.custo || '0');
  ```

### 3. Logs de Debug Adicionados
Foi adicionado console.log na função `salvarCotacao` para depuração:
```typescript
console.log('Status da cotação:', formData.status);
console.log('Valor custo simples:', valorCustoSimples);
console.log('Calcular total custo:', calcularTotalCusto());
console.log('Custo final calculado:', formData.status === 'APROVADO' ? calcularTotalCusto() : parseFloat(valorCustoSimples));
```

## Estrutura do Campo Custo

### No Frontend (Cotacoes.tsx)
- **Input**: Campo numérico com valor mínimo 0 e passo 0.01
- **Estado**: Controlado por `valorCustoSimples`
- **Salvamento**: Incluído no `cotacaoData` da função `salvarCotacao`
- **Carregamento**: Populado na função `handleEditCotacao`

### No Banco de Dados
- **Campo**: `custo` (confirmado como existente)
- **Tipo**: DECIMAL(10,2)
- **Valor padrão**: 0

## Próximos Passos para Depuração

1. **Testar o salvamento** de uma cotação e verificar os logs no console do navegador
2. **Verificar no Supabase** se o valor está sendo persistido na tabela `cotacoes`
3. **Confirmar** se o problema é no frontend ou no backend

## Possíveis Causas do Problema

1. **Conversão de tipo**: Verificar se `parseFloat(valorCustoSimples)` está retornando um valor válido
2. **Validação no Supabase**: Pode haver alguma validação ou trigger impedindo o salvamento
3. **Permissões RLS**: Verificar se as políticas de segurança estão permitindo a atualização do campo
4. **Cache do navegador**: Limpar cache e testar novamente

## Comandos SQL para Verificação

```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cotacoes' AND column_name = 'custo';

-- Verificar valores salvos
SELECT id, titulo, valor, custo, created_at
FROM cotacoes 
ORDER BY created_at DESC
LIMIT 10;

-- Verificar se há registros com custo NULL
SELECT COUNT(*) as registros_sem_custo
FROM cotacoes 
WHERE custo IS NULL;
```

## Status
- ✅ Código frontend verificado e correto
- ✅ Logs de debug adicionados
- ⏳ Aguardando teste com logs para identificar a causa exata
- ⏳ Verificação no banco de dados necessária