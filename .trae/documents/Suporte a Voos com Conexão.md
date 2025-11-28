## Objetivo
- Permitir lançar voos com 0–4 conexões.
- Ao escolher o número de conexões, abrir múltiplos campos de voo (segmentos) para preencher cia, nº do voo, origem/destino, datas e horários, com busca automática.
- No card do voo, exibir origem inicial e destino final com horários; abaixo, listar as conexões atreladas ao card.

## Modelo de Dados
- Adicionar vínculo entre um "voo" e uma "opção com segmentos":
  - `cotacao_opcoes_voo`: incluir `voo_id BIGINT REFERENCES voos(id) ON DELETE CASCADE` (e índice).
  - Segmentar usando `cotacao_opcao_segmentos` já existente (`opcao_id`, `ordem`, `cia`, `numero_voo`, `origem`, `destino`, `partida`, `chegada`, `franquia_bagagem`, `classe_tarifaria`).
- Preço: usar `cotacao_opcoes_voo.preco_total` (mantendo `voos.preco_opcao` para legado).

## Fluxo de Edição (src/pages/Cotacoes.tsx)
- No formulário de lançamento/edição do voo:
  - Campo "Tipo de voo": `Direto`, `1 conexão`, `2`, `3`, `4`.
  - Renderizar `N+1` segmentos conforme seleção.
  - Cada segmento com inputs padrão e botão "Buscar dados" (reuso da integração AeroDataBox), carregando cia/horários/rotas por segmento.
  - Ao salvar:
    1) Criar/atualizar `voos` com origem do 1º segmento e destino do último; horários idem.
    2) Criar/atualizar `cotacao_opcoes_voo` para o `voo_id` + `trecho` (`IDA/VOLTA/INTERNO`), com `preco_total`.
    3) Persistir `cotacao_opcao_segmentos` ordenados, substituindo os anteriores quando editar.

## Visualização (src/pages/CotacaoView.tsx)
- Para cada cartão de voo:
  - Buscar `cotacao_opcoes_voo` pelo `voo_id`.
  - Exibir cabeçalho com origem inicial, destino final e horários (derivados dos segmentos).
  - Abaixo, listar as conexões (segmentos) com cia, nº do voo e horários.
  - Preço: exibir `preco_total` da opção quando existir; senão `voos.preco_opcao`.
  - Bagagem: agregar dos segmentos (quando disponível) ou usar o campo do voo.
- Fallback: quando não houver segmentos, manter apresentação atual.

## Visualização de Impressão (src/pages/CotacaoPrint.tsx)
- Mesma lógica dos segmentos com layout print-friendly.

## Validações
- Seleção de conexões determina quantidade de segmentos (`conexões + 1`).
- Por segmento: obrigatórios `cia`, `numero_voo`, `origem`, `destino`, `partida`, `chegada`.
- Consistência: `partida < chegada` por segmento; ordem crescente.
- Normalização de preço com vírgula/ponto e arredondamento a 2 casas.

## Compatibilidade
- Não quebrar cotações antigas (sem segmentos). Priorizar opção quando existir, senão `voos`.
- Manter `voos.preco_opcao` para leitura antiga; pavimentar a transição para `preco_total`.

## Entregáveis
- Migração mínima para `cotacao_opcoes_voo.voo_id` e índice.
- Utilitários Supabase para criar/atualizar opções e segmentos e carregar por `voo_id`.
- UI de edição com seleção de conexões e busca por segmento.
- Renderização de cartões com múltiplos segmentos e impressão ajustada.

## Próximo Passo
- Após confirmação, implemento migração, utilitários e interfaces de edição/visualização, validando casos: direto, 1, 2, 3 e 4 conexões em `IDA`, `VOLTA` e `INTERNO`. 