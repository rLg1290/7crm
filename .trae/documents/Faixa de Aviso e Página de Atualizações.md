## Objetivo
Adicionar uma faixa fixa no topo do CRM com aviso e botão, levando para uma página "Atualizações" que apresenta as últimas mudanças e um Roadmap dos próximos anos, com visual moderno e consistente com o sistema.

## UX/Design
- Faixa (banner) no topo: discreta, premium, paleta neutra com acento de marca; texto curto e botão CTA.
- Persistência: opção de fechar/ocultar (localStorage), reaparece após período configurável.
- Página de Atualizações: cabeçalho com título e subtítulo; seção "Últimas atualizações" em cards; seção "Roadmap" em linha do tempo ou etapas por ano/trimester.

## Rotas
- Nova rota pública autenticada: `/atualizacoes`.
- Botão da faixa navega para `/atualizacoes`.

## Componentes
- TopAnnouncementBar (novo):
  - Props: `message`, `ctaLabel`, `ctaHref`, `variant`.
  - Comportamento: sticky no topo; fechamento com `localStorage.updates_banner_dismissed=true`.
  - Inserção em `src/components/Layout.tsx` logo acima do header.
- UpdatesPage (novo): `src/pages/Atualizacoes.tsx`:
  - Seção "Últimas atualizações": cards com título, data, tipo (feature/fix), descrição breve, tags.
  - Seção "Roadmap": agrupado por ano (2025, 2026...), subdividido por trimestre/tema; cada item com status (planejado/em andamento/concluído) e descrição.
  - Filtros simples: por tag/ano (MVP opcional).

## Dados (MVP)
- Fonte local: `src/data/updates.ts` exporta arrays:
  - `latestUpdates`: `{id, title, date, type, summary, tags}`.
  - `roadmap`: `{year, items: [{title, description, status, quarter|month, tags}]}`.
- Futuro: tabelas no Supabase
  - `product_updates` (id, title, summary, date, type, tags[], created_by)
  - `product_roadmap` (id, year, quarter, title, description, status, tags[])
  - RLS: leitura para usuários autenticados; escrita só admin.

## Estilo e Interações
- Banner: altura ~48px, ícone informativo, CTA com `hover:bg-blue-600` e `transition` suave.
- Cards de atualização: bordas arredondadas, sombra leve, ícones (lucide) por tipo.
- Roadmap: timeline vertical com marcadores e linhas; cores por status.
- Acessibilidade: `role="region"` para a faixa, `aria-label` e `aria-live="polite"` (se necessário).

## Implementação Técnica
1. Criar `TopAnnouncementBar.tsx` (Tailwind + React) com fechamento persistente.
2. Injetar `TopAnnouncementBar` em `src/components/Layout.tsx` acima do header principal.
3. Criar `src/pages/Atualizacoes.tsx` com as duas sessões (Últimas atualizações e Roadmap).
4. Criar `src/data/updates.ts` com dados de exemplo (inclua a nova Base de Conhecimento no changelog).
5. Registrar rota `/atualizacoes` em `src/App.tsx`.

## Entregáveis
- Componente da faixa com CTA funcional.
- Página de "Atualizações" com cards e roadmap.
- Dados mockados e estrutura pronta para migração ao Supabase.

## Próximos (opcionais)
- Filtros e busca na página.
- Admin para editar atualizações/roadmap.
- Badge "Novo" ao lado do menu "Atualizações" por período.

Posso seguir com a implementação conforme descrito, integrando a faixa no Layout e criando a página `/atualizacoes` com dados locais (MVP)?