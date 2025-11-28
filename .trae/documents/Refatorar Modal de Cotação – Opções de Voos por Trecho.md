## Objetivos
- Permitir múltiplas opções por trecho (IDA, VOLTA, INTERNOS) durante a etapa de cotação, cada opção com valor individual e informações compactas.
- Adiar a escolha da opção emitida para a etapa de aprovação, levando a selecionada para emissão e mantendo as demais como histórico.

## Modelagem de Dados
- `cotacao_opcoes_voo`
  - Adicionar campo `trecho` (`IDA` | `VOLTA` | `INTERNO`).
  - Garantir campos: `preco_total` (numeric), `moeda` (text, default `BRL`), `valido_ate` (date), `is_escolhida` (boolean, apenas marcado na aprovação), `observacoes` (text), metadados (companhia, numero_voo, classe) opcionais.
- `cotacao_opcao_segmentos`
  - Já existe; manter relacionamento por `opcao_id` e campos de rota e datas.
- `cotacoes`
  - Não atualizar `valor` na etapa de cotação; atualizar somente na aprovação com base na opção escolhida.

## Fluxo do Usuário
- Cotação (Etapa 2):
  - Em cada subbloco de trecho, o usuário:
    - Busca voo por número/cia/data (API), auto-preenche campos.
    - Adiciona opções em formato compacto (linha/mini-card), com valor no canto direito.
    - Acrescenta detalhes via dropdown/tooltip (bagagem, classe tarifária, política de remarcação).
  - Sem escolher “emitida” nesta etapa.
- Aprovação (Etapa “COTACAO” ou subetapa dedicada):
  - Listar todas as opções por trecho com radio/checkbox.
  - Marcar qual opção foi escolhida pelo cliente.
  - Ao confirmar, copiar a escolhida para os voos definitivos de emissão e atualizar `cotacoes.valor`.
  - Demais opções permanecem como histórico.

## UI no Modal (Cotação)
- Atualizar `src/pages/Cotacoes.tsx:renderModalContent` na aba `VOOS` (`src/pages/Cotacoes.tsx:2333`):
  - Inserir subblocos por trecho com cabeçalhos: `[ Trecho IDA ]`, `[ Trecho VOLTA ]`, `[ Trecho INTERNOS ]`.
  - Em cada subbloco, renderizar lista de opções compactas:
    - Layout linha: "Voo 123 • LATAM • 10h30 • GRU → MCO • R$ 2.150"; botão editar/remover; dropdown para detalhes.
    - Botão “+ Adicionar nova opção” por trecho.
  - Manter busca via API existente ("Buscar" por número/cia/data) para pré-preencher uma opção.
- Componentização:
  - Reaproveitar e evoluir `OpcoesVoo` existente para aceitar `trecho` e exibir formato compacto.
  - Evitar criar arquivos novos; manter dentro de `Cotacoes.tsx` seguindo padrão atual.

## UI na Aprovação
- Em `src/pages/Cotacoes.tsx` (seção da aprovação `COTACAO` / confirmação):
  - Exibir opções agrupadas por trecho.
  - Radio para selecionar a opção escolhida em cada trecho.
  - Botão “Confirmar aprovação” que:
    - Seta `is_escolhida=true` na opção selecionada.
    - Atualiza `cotacoes.valor` com a soma das opções escolhidas (ou a lógica definida).
    - Copia segmentos da opção escolhida para os voos definitivos (estrutura já usada hoje para emissão).

## Integração com API de Voos
- Manter função de busca (número/cia/data) usada hoje (ex.: `buscarDadosVooAPI`), mas direcionar o preenchimento para uma nova opção do trecho selecionado.
- Calcular "tempo de viagem" a partir de partida/chegada, exibido na linha da opção.

## Persistência e Regras
- Ao adicionar opção:
  - Inserir em `cotacao_opcoes_voo` com `cotacao_id`, `trecho`, `preco_total`, `moeda`, `valido_ate` e dados básicos.
  - Inserir segmentos em `cotacao_opcao_segmentos` associados.
- Editar/remover opção sem perder outras.
- Valor sempre visível e editável; aceitar decimais em `pt-BR` (internamente numeric).
- Não atualizar `cotacoes.valor` nesta etapa; apenas na aprovação.

## Impressão e Visualização
- Na visualização/print, listar opções por trecho de forma clara, destacando a escolhida na aprovação.
- As não escolhidas aparecem como “Opções ofertadas”.

## Migrações (SQL)
- Alterar `supabase/migrations/cotacao_opcoes_voo.sql`:
  - Adicionar coluna `trecho` (varchar ou enum `IDA/VOLTA/INTERNO`).
  - Adicionar `moeda` (text default 'BRL'), `observacoes` (text), `is_escolhida` (boolean default false).
  - Índices: `(cotacao_id, trecho)`, `(opcao_id)` já coberto em segmentos.
  - RLS: manter writes para usuário autenticado, reads públicas conforme necessidade do CRM.

## Impactos em Código
- `src/pages/Cotacoes.tsx`
  - Aba `VOOS` (cotação): inserir subblocos e lista compacta por trecho (ponto de ancoragem em `src/pages/Cotacoes.tsx:2333–2650`).
  - Aprovação: inserir escolha definitiva e atualização de `cotacoes.valor` e migração de segmentos (ponto de ancoragem em `src/pages/Cotacoes.tsx:3435+` onde já tratamos atualizações de cotação).
  - Reaproveitar `OpcoesVoo` (declaração no fim do arquivo `src/pages/Cotacoes.tsx:7431+`), adicionando suporte ao `trecho` e formato compacto.

## Validação
- Cenários de teste:
  - Adicionar 3 opções de IDA e 2 de VOLTA com valores distintos; conferir persistência e edição.
  - Aprovar cotação selecionando uma opção por trecho; conferir atualização de `cotacoes.valor`, criação de voos definitivos e visualização/print.
  - Remover/editar opções sem afetar outras; valores em `pt-BR`.

## Entregáveis
- Migração SQL ajustando `cotacao_opcoes_voo`.
- Modal de cotação atualizado com opções compactas por trecho.
- Etapa de aprovação com seleção definitiva e sincronização com emissão/valor.
- Visualização/print exibindo opções e a escolhida com destaque.