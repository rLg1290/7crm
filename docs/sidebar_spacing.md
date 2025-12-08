# Sidebar: Medidas e Posicionamento

## Header (Logo + Nome)
- Container: `px-3 py-3`, `min-h: 56px`, `gap: 12px` (Tailwind: `min-h-[56px] gap-3`)
- Logo:
  - Expandido: `h-36px × w-36px` (Tailwind: `h-9 w-9`)
  - Colapsado: `h-32px × w-32px` (Tailwind: `h-8 w-8`)
- Nome da agência: fonte `text-sm`, `leading-none`, alinhado verticalmente ao centro com a logo

## Itens de Navegação
- Altura: `h-40px` (Tailwind: `h-10`)
- Padding horizontal: `px-12px` (Tailwind: `px-3`)
- Gap entre ícone e texto: `gap-12px` (Tailwind: `gap-3`)
- Ícone: `h-20px × w-20px` (Tailwind: `h-5 w-5`)

## Seções
- Título: `px-12px`, `py-8px`, `text-[11px]`, `uppercase`, `leading-none`
- Espaçamento vertical entre itens: `8px` (Tailwind: `space-y-2` quando necessário)

## Rodapé (Perfil)
- Posição: `sticky` no `bottom: 8px`
- Botão: mesma altura dos itens (`h-10`) quando aplicável; manter alinhamento horizontal do conteúdo

## Comportamento
- Hover: sidebar expande/colapsa sem deslocar o cabeçalho; expansão para a direita preservando borda esquerda
- Responsividade: largura `w-80px` colapsado (`w-20`) e `w-256px` expandido (`w-64`); transição `200ms ease-out`

