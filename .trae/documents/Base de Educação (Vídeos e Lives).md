## Objetivo
Criar uma base de conhecimento com vídeos e lives organizadas em divisões e subdivisões, gerenciadas via Admin, e acessíveis no sistema normal para agências parceiras. Exemplo de navegação: Lives → 2025 → Novembro → Live realizada 21/11/2025.

## Modelo de Dados (Supabase)
- Tabelas principais:
  - content_category: id, name, slug, type ("Lives" | "Videos" | ...), parent_id (FK), path ("Lives/2025/Novembro"), order, empresa_id (FK opcional), created_at.
  - content_item: id, title, type ("live" | "video"), youtube_url, youtube_id, description, published_at (data/hora do evento), duration_seconds, published (bool), empresa_id (FK), created_by, created_at.
  - content_item_category: content_item_id (FK), category_id (FK) para suportar múltiplas categorias.
- Regras de organização:
  - Raiz "Lives" e "Videos" são categorias.
  - Para lives, anos e meses são categorias-filhas (criadas automaticamente): Lives → Ano (2025) → Mês (Novembro).
  - Itens de conteúdo ficam associados às categorias adequadas via content_item_category.

## Políticas de Segurança (RLS)
- Escrita: apenas admins (profiles.role = 'admin').
- Leitura: usuários autenticados parceiros (profiles.role in ('partner','user','admin')) e por empresa_id quando aplicável.
- Público opcional: permitir leitura de itens com published = true (se desejado) sem login.
- Índices: em content_item(type, published_at), content_category(parent_id), content_item_category(category_id) para consultas rápidas.

## Admin (CRUD)
- Nova seção "Educação" no Admin:
  - Gerenciar categorias (árvore): criar raiz, anos e meses; mover/ordenar.
  - Cadastrar conteúdos: título, tipo (live/video), YouTube URL; parser extrai youtube_id; descrição, data/hora, duração, publicar.
  - Associação a categorias via seletor de árvore (Lives → 2025 → Novembro).
  - Auto-criação de categorias ano/mês ao salvar uma live caso não existam.
  - Listagem com filtros: tipo, ano, mês, published.

## Sistema Normal (Frontend)
- Nova aba "Educação" com navegação por árvore:
  - Coluna/accordion: Lives → anos → meses.
  - Painel de itens: cards com título, data, e thumbnail do YouTube; clique abre player embed.
- Rotas:
  - /educacao (lista e árvore)
  - /educacao/lives/:ano/:mes (filtrada)
  - /educacao/item/:id (detalhe com embed do YouTube)

## Consultas e Agrupamentos
- Vidas por ano/mês: selecionar content_item com type='live' e join com content_item_category → category path começa com "Lives/2025/Novembro".
- Alternativa de agrupamento por data: agrupar por EXTRACT(YEAR/MONTH) de published_at (mantemos ambos para flexibilidade).

## YouTube
- Armazenar youtube_url e youtube_id; embed via `https://www.youtube.com/embed/{youtube_id}`.
- Thumbnail: `https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg` (campo derivado no frontend; opcional persistir).

## Migração/Setup
- Criar tabelas e RLS via SQL (Supabase):
  - CREATE TABLE content_category (...);
  - CREATE TABLE content_item (...);
  - CREATE TABLE content_item_category (...);
  - Policies: INSERT/UPDATE/DELETE para admins; SELECT para autenticados/parceiros; opcional SELECT público quando published = true.
- Seeds opcionais: categorias raiz (Lives, Videos) por empresa.

## Integração e Reuso
- Reusar padrões de listagem/filtro existentes (ex.: Financeiro) para filtros de ano/mês e categorias.
- Reusar checagem de role (profiles.role) já presente no Admin.

## Entregáveis
1. SQL de criação das tabelas + políticas RLS.
2. Páginas Admin: árvore de categorias, cadastro de conteúdo, listagem com filtros.
3. Páginas do Sistema: navegação por árvore, listagem e detalhe com embed.
4. Testes manuais e verificação de performance com índices.

## Confirmação
Posso começar criando as tabelas e políticas no Supabase, adicionar as rotas/abas no Admin e no Sistema, e montar as telas conforme descrito. Confirma seguir este plano?