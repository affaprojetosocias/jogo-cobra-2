# Jogo da Cobrinha Moderno

Este projeto implementa um jogo da cobrinha com visual moderno inspirado em Snake.io+.

## Pré-requisitos

O jogo é totalmente client-side, bastando um navegador moderno (Chrome, Firefox, Edge ou Safari) com suporte a ES modules.

## Como executar localmente

1. **Clonar ou copiar** este repositório para sua máquina.
2. **Abrir um servidor HTTP local** em qualquer porta. Algumas opções simples:
   - Usando Python 3: `python3 -m http.server 5173`
   - Usando Node.js (instalando http-server): `npx http-server -p 5173`
3. **Abrir o navegador** em `http://localhost:5173` (ajuste a porta conforme o comando escolhido).
4. Clique em **"Pressione para iniciar"** ou pressione qualquer tecla/toque para começar a partida.

> Abrir o arquivo `index.html` diretamente (via `file://`) pode bloquear carregamento de áudio e causar comportamento diferente em alguns navegadores, por isso recomendamos utilizar um servidor HTTP local.

## Controles

- **Desktop**: use as teclas `W`, `A`, `S`, `D` ou as setas direcionais. O cursor do mouse também pode ser usado para direcionar a cabeça da cobra.
- **Dispositivos móveis**: arraste o dedo na direção desejada.

## Recursos principais

- Movimento suave com aceleração gradual conforme a cobra cresce.
- Partículas e efeitos luminosos em alimentos e ambiente.
- Interface com pontuação atual, tempo de jogo e recorde.
- Sons para coleta e fim de jogo.
- Reinício rápido após o game over.

## Testes e validação de layout

- Consulte `docs/mobile-testing-checklist.md` para o roteiro completo de verificação em emuladores e dispositivos físicos, incluindo comportamentos esperados por breakpoints e uma lista de regressão para garantir que o modo desktop permaneça intacto.

## Estrutura do código

- `index.html`: estrutura base, HUD e inicialização do canvas.
- `styles.css`: estilos, gradientes e layout responsivo.
- `src/main.js`: ponto de entrada do jogo.
- `src/game/`: módulo principal contendo lógicas de jogo (cobra, comida, renderização, áudio, entrada, configuração).

Sinta-se à vontade para modificar `GameConfig.js` para ajustar parâmetros como velocidade, cores e densidade de alimentos.
