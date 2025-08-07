# Instruções para Adicionar Campo "Numero de Vezes" (Parcelamento)

## ✅ Implementação Concluída no Frontend

O campo "Numero de Vezes" foi adicionado com sucesso na aba de venda do arquivo `Cotacoes.tsx`:

- ✅ Campo `parcelamento` adicionado à interface `FormularioCotacao`
- ✅ Campo inicializado com valor padrão '1' no `formData`
- ✅ Input "Numero de Vezes" adicionado na aba de venda (modo simplificado)
- ✅ Campo incluído na função `salvarCotacao` para salvar no banco
- ✅ Campo incluído na função `handleEditCotacao` para carregar dados existentes

## 🔧 Próximo Passo: Executar Script SQL

Para que o campo funcione completamente, você precisa adicionar a coluna `parcelamento` na tabela `cotacoes` do banco de dados.

### Como Executar:

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Acesse o projeto do sistema de cotações

2. **Execute o Script SQL**
   - No painel do Supabase, vá para **SQL Editor**
   - Clique em **New Query**
   - Abra o arquivo `adicionar_campo_parcelamento.sql` criado na raiz do projeto
   - Copie todo o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em **Run** para executar

3. **Verificar Resultado**
   - O script mostrará se o campo foi adicionado com sucesso
   - Você verá uma consulta de verificação no final
   - Todos os registros existentes terão parcelamento = '1' por padrão

## 🎯 Funcionalidade Implementada

### Na Aba de Venda:
- Campo "Numero de Vezes" aparece ao lado da "Forma de Pagamento"
- Aceita valores de 1 a 24 parcelas
- Valor padrão é 1 (à vista)
- Layout responsivo (2 colunas em desktop, 1 coluna em mobile)

### No Banco de Dados:
- Campo `parcelamento` do tipo VARCHAR(10)
- Valor padrão '1'
- Índice criado para melhor performance
- Compatível com registros existentes

## 🔍 Como Testar

Após executar o script SQL:

1. **Criar Nova Cotação:**
   - Acesse o módulo de Cotações
   - Clique em "Nova Cotação"
   - Vá para a aba "VENDA"
   - Verifique se o campo "Numero de Vezes" aparece
   - Teste alterando o valor e salvando

2. **Editar Cotação Existente:**
   - Abra uma cotação existente
   - Vá para a aba "VENDA"
   - O campo deve mostrar '1' por padrão
   - Altere o valor e salve
   - Reabra a cotação para verificar se o valor foi salvo

## 📋 Estrutura do Campo

```typescript
// Interface TypeScript
interface FormularioCotacao {
  // ... outros campos
  parcelamento: string; // Numero de vezes/parcelas
}

// Input HTML
<input
  type="number"
  min="1"
  max="24"
  value={formData.parcelamento}
  onChange={e => setFormData(prev => ({ ...prev, parcelamento: e.target.value }))}
  className="w-full border rounded px-3 py-2"
  placeholder="1"
/>
```

## ⚠️ Importante

- Execute o script SQL **apenas uma vez**
- O campo aceita valores de 1 a 24
- Valor padrão sempre será '1' (à vista)
- O campo é salvo como string para flexibilidade futura
- Compatível com todas as cotações existentes

## 🎉 Resultado Final

Após seguir estas instruções, o campo "Numero de Vezes" estará totalmente funcional:
- ✅ Visível na aba de venda
- ✅ Salvo no banco de dados
- ✅ Carregado ao editar cotações
- ✅ Compatível com sistema existente