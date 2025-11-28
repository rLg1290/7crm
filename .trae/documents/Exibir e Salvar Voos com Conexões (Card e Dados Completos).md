## Objetivo
- Persistir e exibir voos com conexões, mostrando no card o texto acima da linha central ("Voo direto" ou "1 Conexão", "2 Conexões"...).
- Anexar os dados das conexões ao card do voo (companhia, número do voo, origem/destino e horários por segmento), seguindo o segundo print.

## Modelo de Dados
- Usar `cotacao_opcoes_voo` como o contêiner da opção por trecho (IDA/VOLTA/INTERNO).
- Usar `cotacao_opcao_segmentos` para guardar todos os segmentos (ordem, cia, número, origem, destino, partida local (data+hora), chegada local (data+hora), franquia, classe).
- Compatibilidade: quando o banco remoto não tiver `voo_id` em `cotacao_opcoes_voo`, operar sem esse vínculo; quando existir, vincular diretamente por `voo_id`.

## Persistência (Salvar)
1. No formulário em `src/pages/Cotacoes.tsx`:
   - Ao clicar "Salvar opção + conexões":
     - Selecionar/Inserir a opção (`cotacao_opcoes_voo`) para o trecho atual, com `preco_total` e, se disponível, `voo_id`.
     - Apagar segmentos antigos da opção e inserir os atuais em `cotacao_opcao_segmentos` com `ordem` crescente.
     - Atualizar o resumo do voo (origem = 1º segmento, destino = último segmento, horários agregados).
   - Normalizar busca na API: se retornar múltiplos, selecionar o item cujo `departure.scheduledTime.local` coincide com a data escolhida pelo usuário.
   - Partida: manter a data escolhida pelo usuário; hora da API. Chegada: data/hora da API.

## Renderização (CotacaoView)
1. Carregar opções e segmentos por cotação:
   - Consultar `cotacao_opcoes_voo` sem `voo_id` (para evitar 400); quando disponível, usar `voo_id` para mapear rapidamente.
   - Consultar `cotacao_opcao_segmentos` por `opcao_id` (ordenados).
2. Para cada cartão de voo (IDA, INTERNO, VOLTA):
   - Determinar agregados:
     - Origem = 1º segmento.origem (fallback: `voo.origem`).
     - Destino = último segmento.destino (fallback: `voo.destino`).
     - Partida/Chegada = horários dos segmentos (fallback: `voo`).
   - Calcular "Paradas" = `segmentos.length - 1`.
   - Calcular duração somando diferenças entre `partida` do primeiro e `chegada` do último (local strings → Date).
   - Exibir acima da linha central um "chip" textual:
     - `Voo direto` se `segmentos.length === 1`.
     - `1 Conexão` se `segmentos.length === 2`; `n Conexões` para `>2`.
   - Exibir lista de conexões abaixo da linha central:
     - Cada linha: `CIA • Voo XXX — Origem (DD/MM HH:mm) → Destino (DD/MM HH:mm)`.
   - Manter bagagens, preço da opção e logo da companhia como hoje.
3. Locais de edição no arquivo para inserir os elementos:
   - IDA: bloco próximo de `src/pages/CotacaoView.tsx:318-358`.
   - INTERNO: bloco próximo de `src/pages/CotacaoView.tsx:389-416`.
   - VOLTA: bloco próximo de `src/pages/CotacaoView.tsx:446-473`.

## Impressão (CotacaoPrint)
- Replicar a lógica: cabeçalho com origem/destino agregados, duração e paradas; lista de segmentos com horários; preço.

## Tratamento de Falhas do Banco
- Todas as consultas/inserts com fallback quando `voo_id` não existir (já aplicado na camada de persistência e na view). Nenhum 400 deve quebrar a UI.

## Validações
- Segmentos devem ter: cia, nº, origem, destino, `partida` (data+hora), `chegada` (data+hora).
- Seleção de múltiplos registros na API por número: usar a data escolhida para decidir o item; chegada sempre da API.

## Entregáveis
- Ajustes em `Cotacoes.tsx` para salvar e atualizar voos + segmentos (mantendo os fallbacks remotos).
- Ajustes em `CotacaoView.tsx` para exibir chips de conexão, duração e lista de segmentos anexada ao card.
- Ajustes em `CotacaoPrint.tsx` para saída de impressão com múltiplos segmentos.

## Observação
- Caso deseje vínculo por `voo_id` na view para mapear conexões diretamente por voo, podemos ativar isso ao aplicar a migração da coluna `voo_id` em `cotacao_opcoes_voo` no banco remoto.