# Correção: Botão de Editar para Cotações EMITIDAS

## Problema Identificado
O botão de editar estava desaparecendo quando uma cotação era transformada para o status "EMITIDO".

## Análise do Problema
No arquivo `Cotacoes.tsx`, na função `CardCotacao` (linha ~1359), havia uma condição que ocultava o botão de editar para cotações com status "EMITIDO":

```typescript
{cotacao.status !== 'EMITIDO' && (
  <button onClick={(e) => { e.stopPropagation(); onEdit(); }}>
    <Edit className="w-3 h-3 text-yellow-500" />
  </button>
)}
```

## Correção Implementada
Removida a condição `cotacao.status !== 'EMITIDO'` do botão de editar, permitindo que cotações emitidas possam ser editadas.

### Arquivo Modificado:
- `src/pages/Cotacoes.tsx` (linha ~1359)

### Mudança:
- **Antes**: Botão de editar condicional (oculto para status EMITIDO)
- **Depois**: Botão de editar sempre visível para todas as cotações

## Resultado
Agora o botão de editar permanece visível para cotações com status "EMITIDO", permitindo que sejam editadas quando necessário.

## Teste
1. Transformar uma cotação para status "EMITIDO"
2. Verificar se o botão de editar (ícone de lápis) permanece visível
3. Clicar no botão e confirmar que o modal de edição abre normalmente

---
*Correção implementada em: [Data atual]*
*Arquivo de documentação: CORRECAO_BOTAO_EDITAR_COTACOES_EMITIDAS.md*