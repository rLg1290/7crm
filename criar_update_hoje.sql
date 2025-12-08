insert into public.product_updates (date, title, summary, type, tags)
values (
  current_date,
  'Atualização de interface e chat',
  'Sidebar reorganizado em 4 categorias, botão fixo de Atualizações, bloqueio da página Aéreo com aviso, melhorias de chat (hover menu, indicador de conversa ativa, fechamento por clique fora/ESC), busca de aeroportos acento-insensível e seleção de aeroporto com chip editável.',
  'release',
  array['sidebar','chat','aereo','ux','busca']
);

