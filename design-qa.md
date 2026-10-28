# Design QA — redesign Dulce di Naty

final result: passed

## Evidências

- Verdade visual: `C:\Users\ravtec\AppData\Local\Temp\codex-clipboard-e4fea42e-fd8d-4600-acaf-ba6140a4f1b1.png` (mobile, 1478 × 1065) e `C:\Users\ravtec\AppData\Local\Temp\codex-clipboard-c3eaaa11-8da8-4f42-b4b8-82b9c047b829.png` (desktop, 1024 × 1536).
- Implementação mobile: `artifacts/redesign-390x844.png`, `artifacts/redesign-390x844-sabores.png`, `artifacts/redesign-390x844-embalagem.png` e `artifacts/redesign-390x844-pedido.png`.
- Implementação desktop: `artifacts/redesign-1440x900.png`.
- Viewports CSS: 390 × 844 e 1440 × 900, `deviceScaleFactor: 1`. Capturas e viewport têm a mesma densidade; não houve reamostragem.
- Estado: hero inicial; seção de sabores com Ninho selecionado; embalagem; modal com Brigadeiro selecionado.
- Comparação de tela inteira: referências e capturas foram abertas na resolução original e comparadas em conjunto.
- Regiões focadas: hero, seletor/CTA de sabores, enquadramento da embalagem e modal de quantidades.

## Superfícies de fidelidade

- Tipografia: títulos serifados com peso editorial, entrelinha compacta e escala específica para mobile/desktop; texto de interface em sans-serif.
- Espaçamento e ritmo: hero ocupa a primeira tela móvel com CTA e parte do brownie; seções seguem brownie → sabores → embalagem → pedido, sem rolagem horizontal.
- Cores: creme, chocolate, rosa e azul da embalagem mapeados para tokens simples, sem excesso de gradientes ou ornamentos.
- Imagens: logo original preservado; fotos existentes do projeto usadas em hero, sabores, embalagem e produção; enquadramento da embalagem evita destacar a data.
- Conteúdo: cinco sabores, 100 g, pedido mínimo de 15 unidades, validade de 10 dias, entrega/retirada, parceria e WhatsApp preservados.

## Histórico de comparação

1. P1 — primeira captura móvel tinha viewport mínimo do Edge e recortava o carrinho. Correção: captura final com emulação Playwright em 390 px; evidência mostra carrinho visível e `scrollWidth = 390`.
2. P2 — título móvel ocupava cinco linhas e reduzia demais a foto. Correção: variante responsiva em três linhas; CTA e brownie aparecem na primeira tela.
3. P2 — CTA de sabores ficava abaixo de 844 px. Correção: título, gaps e mídia compactados; captura final mostra seletor completo e “Adicionar ao pedido”.
4. P2 — data da embalagem ficava visível no enquadramento. Correção: `object-position` reposicionado; captura final preserva marca/cores sem destacar a data.

## Verificações

- Build de produção: passou.
- Testes automatizados: 4/4 passaram no Edge Headless.
- Interação principal: seleção de Brigadeiro e abertura do modal passaram.
- Console: nenhum erro.
- Responsividade: 390 × 844 e 1440 × 900 sem overflow horizontal.
- Movimento reduzido: validado com `prefers-reduced-motion: reduce`.

Sem achados P0/P1/P2 restantes. Diferenças de P3: a tipografia é uma aproximação com Georgia e as fotografias existentes não têm exatamente o mesmo enquadramento das referências.
