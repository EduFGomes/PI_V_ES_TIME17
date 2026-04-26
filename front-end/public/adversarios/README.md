# Imagens dos adversarios por fase

Coloque as imagens nesta pasta usando este padrao de nome:

- `fase1.png`
- `fase2.png`
- `fase3.png`
- ...

Como funciona no jogo:

- A fase atual selecionada usa automaticamente o arquivo `faseX.png`.
- Exemplo: se estiver na fase 4, o frontend tenta carregar `public/adversarios/fase4.png`.
- Se a imagem nao existir, o jogo usa `placeholder.svg`.

Para adicionar novos adversarios:

1. Adicione um novo arquivo PNG com nome `faseN.png`.
2. Garanta que `N` corresponde ao numero da fase.
3. Pronto: o frontend reconhece automaticamente sem alterar codigo.
