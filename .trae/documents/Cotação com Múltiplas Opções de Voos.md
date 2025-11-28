## Objetivo
Permitir que um único card de cotação agrupe várias opções de voos com preços diferentes, evitando a necessidade de criar múltiplos cards. O usuário escolhe quais opções incluir no orçamento e marca a opção preferida.

## Modelagem de Dados (Supabase)
- Nova entidade: `cotacao_opcoes_voo`
  - Campos: `id`, `cotacao_id` (FK), `titulo` (ex.: “LATAM – ida 07:05 | volta 22:10”), `is_preferida` (bool), `status` (ex.: ativo/inativo), `preco_total` (numérico), `moeda`, `valido_ate` (data), `observacoes`, `created_at`
- Segmentos por opção: `cotacao_opcao_segmentos`
  - Campos: `id`, `opcao_id` (FK), `ordem`, `cia`, `numero_voo`, `origem`, `destino`, `partida` (datetime), `chegada` (datetime), `franquia_bagagem`, `classe_tarifaria`, `fare_rules`
- Compatibilidade com atual: se já usamos `voos` dentro de `cotacoes`, podemos:
  - Manter `voos` e adicionar `opcao_id` (FK) para agrupar por opção
  - Ou migrar `voos` existentes criando uma opção padrão por cotação e vinculando os segmentos
- RLS: leitura por empresa, escrita pelo autor/admin; índices por `cotacao_id` e `is_preferida`.

## Regras de Negócio
- Totais da cotação:
  - `cotacao.valor` reflete o `preco_total` da opção marcada como `is_preferida`
  - Kanban soma o `preco_total` da preferida; se nenhuma preferida, usa a primeira ativa
- Envio para cliente:
  - O usuário seleciona quais opções incluir; a preferida recebe destaque “Recomendado”
- Validações:
  - Preço por passageiro vs preço total (definir padrão: preço total para todos os passageiros)
  - Datas/validades exibem alertas se expiradas
  - Segmentos coerentes (conexão/tempo mínimo)

## UX no CRM (Cotação)
- No card de cotação, nova seção “Opções de voo”:
  - Lista de opções com: título, preço, validade, tags
  - Ações: adicionar opção, duplicar opção, marcar como preferida, ativar/desativar, excluir
  - Dentro de cada opção: editor de segmentos (adicionar/editar/remover), franquias, fare rules
- Enviar cotação:
  - Modal com checklist de opções a incluir no orçamento
  - Escolher preferida (se não houver) e confirmação

## Orçamento de Viagem (Visualização/Impressão)
- Mostrar blocos por opção:
  - Cabeçalho com título, badge “Recomendado”, preço total, validade
  - Linha do tempo dos segmentos (ida/volta), franquias e observações
- Resumo:
  - Destacar a opção preferida no topo
  - Texto padronizado de disclaimers (regras tarifárias/validade)

## Serviços/Integração
- Novas funções em serviços:
  - `createOpcaoVoo(cotacaoId, payload)` / `updateOpcaoVoo(id, payload)` / `deleteOpcaoVoo(id)`
  - `addSegmento(opcaoId, payload)` / `updateSegmento(id, payload)` / `deleteSegmento(id)`
  - `setPreferida(cotacaoId, opcaoId)` (garante única preferida)
- Ajustes:
  - Atualizar `getTotalPorStatus` e renders do Kanban para usar o preço da preferida
  - Migração de `voos` atuais para uma opção padrão

## Migração e Compatibilidade
- Cada cotação com `voos` atuais gera uma `cotacao_opcoes_voo` “Opção padrão” e vincula os segmentos
- Se não houver voos, a UI segue funcionando (nenhuma opção; botão “Adicionar opção”)

## Entregáveis
1. SQL das novas tabelas + políticas RLS
2. CRUD no CRM (UI) de opções e segmentos
3. Atualização do envio de cotação (seleção de opções)
4. Ajustes no Kanban e no Orçamento/Print
5. Migração dos dados existentes

## Roadmap (melhorias futuras)
- Comparativo visual de preço/duração entre opções
- Regras automáticas de melhor opção (menor preço/menor duração)
- Exportação de proposta com seleção interativa pelo cliente

Confirma que seguimos com essa implementação (modelo, UI/serviços e migração)?