## Visão Geral
Implementar uma experiência de educação corporativa premium para agências de viagem, integrada ao CRM, com foco em Lives e vídeos gravados. Design moderno, minimalista e tecnológico, priorizando clareza, eficiência e consistência com o visual do sistema.

## Arquitetura de Rotas
- /educacao → Tela Principal (Listagem)
- /educacao/item/:id → Tela de Visualização (Player)
- /educacao/lives → Tab Lives (com filtros Ano/Mês)
- /educacao/videos → Tab Vídeos (com filtros por Categoria)
- /educacao/categorias → Navegação por temas
- /educacao/favoritos → Conteúdos favoritados

## 1. Tela Principal – Listagem de Conteúdos
### Cabeçalho
- Título: "Base de Conhecimento"
- Subtítulo: frase curta explicando a finalidade (educação e capacitação contínua)
- Estilo: tipografia profissional, espaçamento generoso, ícone sutil (BookOpen)

### Barra de Controles
- Campo de busca com placeholder "Buscar conteúdo…" (debounce, destaca match no título)
- Toggle/segmented: "Lives ao vivo | Vídeos gravados"
- Filtros condicionais:
  - Lives: dropdowns ou chips para Ano e Mês (ex.: 2023, 2024…; Jan–Dez)
  - Vídeos gravados: filtro por Categoria/Conteúdo (chips ou dropdown multi)
- Alternância de visualização: grid/list

### Listagem (Grid/List)
- Card responsivo com:
  - Thumbnail (YouTube)
  - Título
  - Tipo (Live/Gravado)
  - Data (Lives) ou Duração (Vídeos)
  - Ícone play
- Interações:
  - Hover: leve elevação (shadow-md → shadow-lg) e highlight do play
  - Seleção de filtros: animação suave, feedback visual no chip ativo
- Paleta e estilo:
  - Base neutra (cinzas), cor primária da marca para estados ativos
  - Cantos arredondados, sombra leve, espaçamento consistente
- Estado vazio e skeleton loaders

## 2. Tela de Visualização – Player do Conteúdo
### Player central
- Player responsivo com controles padrão (YouTube embed)
- Dimensão predominante no layout

### Metadados de Conteúdo
- Título em destaque
- Descrição breve
- Informações: tipo (Live/Gravado), data, duração, categoria
- Botão "Voltar" (retorna à listagem mantendo filtros/scroll)

### Estados especiais
- Live ao vivo: badge "🔴 Live agora" e opcional contador de transmissão

### Conteúdos Relacionados
- Rail de mini cards na lateral ou abaixo, com scroll horizontal ou grid compacto
- Critério: mesma categoria/tema, proximidade de data

### Ações do Usuário
- Botão "Favoritar"
- Botão "Marcar como concluído"
- Persistência por usuário (Supabase) e atualização visual imediata

## 3. Estrutura Educacional (Organização)
- Tabs/seções: Lives | Vídeos gravados | Categorias | Favoritos
- Dashboard opcional: Últimos adicionados, Mais assistidos, Recomendados
- Progresso de consumo (% assistido) por item
- Organização por temas: Gestão, Atendimento, Tecnologia, Jurídico (categorias principais)

## Componentes Principais
- KnowledgeHeader (título + subtítulo)
- ContentFilters (busca, segmented lives/vídeos, filtros condicionais, grid/list toggle)
- ContentCard (card do conteúdo)
- ContentGrid / ContentList (galerias)
- PlayerView (player + metadados + ações)
- RelatedRail (mini cards relacionados)
- CategoryTabs/Sidebar (organização por temas)
- FavoritesView (listagem do usuário)

## Dados e Integração (Supabase)
- Conteúdos: `content_item` (id, title, type, youtube_id/url, description, published_at, duration_seconds, published)
- Categorias: `content_category` (hierarquia, temas)
- Associação: `content_item_category`
- Progresso: `content_progress` (user_id, item_id, percent, last_watched_at)
- Favoritos: `content_favorite` (user_id, item_id)
- Métricas: `content_metrics` (views, favorites_count)

## Microinterações e UX
- Hover suave nos cards; ripple discreto no play
- Chips com animação de seleção, estados ativos claros
- Skeletons na lista enquanto carrega; placeholders em cards
- Sticky controls (filtros) no topo ao rolar
- Estado persistente dos filtros via query params

## Responsividade
- Foco em desktop e tablets (breakpoints lg/xl)
- Grid fluido: 4 colunas desktop, 2–3 em tablets
- Player redimensiona mantendo proporção

## Acessibilidade e Performance
- Labels e aria para controles
- Contraste adequado para legibilidade
- Lazy loading de thumbs e related
- Debounce na busca; paginação/“carregar mais”

## Fluxos do Usuário
1. Descoberta: entra na Base, usa busca/filtros, alterna grid/list, abre player
2. Consumo: assiste, marca concluído, favoritar, navega para relacionados
3. Organização: acessa Categorias, filtra por temas, salva favoritos
4. Retorno: volta à listagem com estado de filtros preservado

## Recomendações Adicionais
- Breadcrumbs de categoria no player
- "Continuar assistindo" na tela principal
- "Compartilhar link" (deep-link para item)
- Telemetria de engajamento para recomendação futura

## Entregáveis
- Estrutura de telas e hierarquia visual
- Componentes e layout com interações definidas
- Rotas e fluxos de navegação
- Recomendações de UI/UX e dados necessários para favoritos/progresso

Confirma que seguimos com essa implementação (componentes, rotas e integrações) no CRM?