## Objetivo
- Substituir o menu horizontal atual por uma barra lateral vertical retrátil, escalável para muitos itens, mantendo performance, acessibilidade e consistência visual.

## Princípios
- Escalabilidade: suportar dezenas de entradas organizadas em grupos.
- Consistência: manter identidade visual (Tailwind + ícones lucide-react).
- Acessibilidade: foco, teclas de atalho, labels, contraste.
- Responsividade: colapsável, comportamentos distintos para desktop e mobile.

## UX/Comportamento
- Layout base: sidebar fixa à esquerda (64–72px colapsada, 240–280px expandida), área de conteúdo à direita.
- Modos:
  - Expandido: mostra ícone + label e grupos.
  - Colapsado: apenas ícones com tooltip.
  - Mobile: sidebar em overlay tipo drawer, abre sobre o conteúdo.
- Padrões:
  - Destaque do item ativo por rota (React Router).
  - Grupos com cabeçalhos e itens (ex.: Operações, Vendas, Clientes, Financeiro, Calendário, Promoções, Educação).
  - Campo de busca global opcional no topo da barra.
  - Botão de toggle no header superior (hamburger) e atalho (tecla “S”).
  - Tooltips nos ícones no modo colapsado.
  - Persistência do estado expandido/colapsado em localStorage (por usuário).

## IA/Chat
- FAB de chat permanece no canto inferior direito.
- Quando sidebar está expandida, FAB desloca-se ligeiramente para evitar sobreposição.

## Arquitetura Técnica
- Componentes novos:
  - `Sidebar.tsx`: barra lateral (recebe schema de navegação).
  - `SidebarSection.tsx`: cabeçalho de grupo + lista de itens.
  - `NavItem.tsx`: item com ícone, label, rota, badge opcional.
  - `SidebarToggle.tsx`: botão e lógica de persistência do estado.
- Integração:
  - Refatorar `src/components/Layout.tsx` para grid: `grid-cols-[sidebar]` + conteúdo.
  - Remover menu central horizontal; migrar itens para `Sidebar`.
  - Manter header superior para logo, empresa e ações rápidas (notificações, perfil, sair).
- Dados de navegação:
  - Definir um `navSchema` (array) com sections e items: `{ id, label, icon, to, badge?, requireRole? }`.
  - Filtrar por `role`/permissões quando necessário.

## Responsividade
- Desktop ≥1024px: sidebar fixa, colapsável.
- Tablet 768–1023px: colapsada por padrão; expande ao hover/click.
- Mobile <768px: overlay (drawer) com backdrop; fecha ao clicar fora ou ESC.

## Acessibilidade
- Foco visível (`focus:ring`), navegação por teclado (setas/Tab), `aria-expanded`/`aria-controls`.
- Tooltips com `aria-label` quando colapsado.
- Atalho “S” para alternar estado; ESC para fechar overlay mobile.

## Performance
- Ícones carregados localmente via `lucide-react` (árvore de imports específica).
- Evitar re-render no conteúdo ao alternar sidebar (estado isolado no Layout).
- Uso de `will-change: width` e transições leves (`transition-[width,opacity]`).

## Estilo (Tailwind)
- Colapsado: `w-16` (ou `w-20`); Expandido: `w-64`.
- Transições: `transition-all duration-200 ease-out`.
- Separadores: `border-r`, fundo `bg-white`, sombra sutil `shadow-sm`.
- Estado ativo: `bg-blue-50 text-blue-700 border-l-2 border-blue-600`.

## Passos de Implementação
1. Criar `Sidebar.tsx`, `SidebarSection.tsx`, `NavItem.tsx`, `SidebarToggle.tsx`.
2. Definir `navSchema` com grupos e itens atuais (Cotações, Clientes, Financeiro, Calendário, Promoções, Educação) e espaço para novos.
3. Refatorar `Layout.tsx` para grid com coluna da sidebar.
4. Remover menu horizontal e migrar lógica de item ativo para `NavItem` (via `useLocation`).
5. Persistência de estado colapsado (localStorage `sidebar_collapsed_<userId>`).
6. Mobile overlay com `fixed inset-0` + backdrop e foco inicial.
7. Adicionar atalho “S” e ESC.
8. Ajustar FAB do chat para deslocar `right` quando expandido.
9. Revisar páginas para garantir ausência de overflow lateral.
10. Testes manuais: navegação, foco, responsividade, desempenho.

## Impactos e Compatibilidade
- Sem mudança nas rotas; apenas no contêiner de layout.
- Ícones e labels seguem os atuais; novos grupos facilitam expansão futura.
- Admin pode adotar mesma abordagem com schema próprio.

## Validação
- Checklist: acessibilidade (Tab/Shift+Tab), tooltips, estado persistido, overlay mobile, rota ativa.
- Medir CLS/Layout Shift ao alternar estado.

## Próximos
- Busca global rápida na sidebar.
- Badges dinâmicos (ex.: contagem de notificações/pendências).
- Suporte a submenus (accordion) para futuras áreas.

Aguardo confirmação para iniciar a implementação seguindo estes passos.