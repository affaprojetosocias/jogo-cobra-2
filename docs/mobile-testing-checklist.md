# Validação de Layout e Controles em Dispositivos Móveis

Este guia descreve o fluxo recomendado para validar o layout, desempenho e controles do jogo Snake.io+ em diferentes tamanhos de tela, incluindo etapas na Chrome DevTools e em dispositivos físicos. Também inclui uma lista de verificação de regressão para garantir que o modo desktop continue funcionando conforme esperado.

## 1. Preparação

1. Inicie o servidor local conforme descrito no README (ex.: `python3 -m http.server 5173`).
2. Abra o jogo em `http://localhost:5173` no Google Chrome.
3. Limpe o cache/hard reload antes de cada rodada de testes para evitar resquícios de sessões anteriores.

> **Nota:** Este documento foi redigido em ambiente sem acesso a dispositivos físicos. Ao executar os testes em produção, inclua capturas de tela e observações reais obtidas com smartphones/tablets de referência.

## 2. Teste em DevTools (emulação mobile)

1. Abra o Chrome DevTools (`Ctrl+Shift+I` ou `Cmd+Opt+I`).
2. Ative o **Device Toolbar** (`Ctrl+Shift+M` ou ícone de dispositivo). Isso habilita a emulação de tamanhos de tela e orientação.
3. Configure o zoom para 100% e selecione os dispositivos sugeridos abaixo. Use "Responsive" quando o modelo não estiver listado.
4. Para cada dispositivo/orientação, execute o fluxo de jogo:
   - Verifique se a `orientation-overlay` é exibida em modo retrato quando a largura disponível é menor que 900px.
   - Confirme que os controles virtuais (`#mobile-controls`) aparecem em modo paisagem em telas menores que 900px e que não aparecem em telas maiores (≥ 901px).
   - Clique/toque nos botões virtuais para garantir que a entrada é propagada para o jogo.
   - Inicie uma partida, colete alguns alimentos e force o game over para verificar overlays, HUD e botão de reinício.
   - Observe se a animação e a taxa de quadros permanecem estáveis (sem travamentos perceptíveis) enquanto a cobra cresce.
5. Teste de redimensionamento: com o Device Toolbar ativado em modo "Responsive", arraste a largura/altura para validar transições suaves entre breakpoints (1024px, 900px, 768px, 680px).
6. Valide as combinações sugeridas:

| Dispositivo (DevTools) | Orientação | Expectativa principal |
| ---------------------- | ---------- | --------------------- |
| iPhone SE / 12 Pro     | Retrato    | `orientation-overlay` visível, canvas desfocado e controles ocultos. |
| iPhone SE / 12 Pro     | Paisagem   | Canvas ocupa 100% do viewport, HUD centralizado e controles móveis exibidos. |
| Pixel 7                | Paisagem   | Controles móveis visíveis; verificar espaçamento seguro (safe-area) e responsividade da HUD. |
| iPad Air               | Paisagem   | Game wrapper centralizado, controles móveis desativados (largura ≥ 901px) e HUD em coluna. |
| Surface Duo (modo duplo) | Paisagem   | Garantir que overlays se adaptam, sem cortes em dobra virtual. |
| Responsive 1280×720    | Paisagem   | Layout de desktop intacto, sem exibir controles móveis. |

> Sempre valide também o comportamento do áudio caso o navegador permita reprodução durante a emulação.

## 3. Teste em dispositivos físicos

1. Utilize ao menos um smartphone Android (Chrome) e um iPhone (Safari). Tablets como iPad ou Galaxy Tab ajudam a cobrir breakpoints maiores.
2. Conecte o dispositivo à mesma rede do servidor local e acesse o endereço LAN (ex.: `http://192.168.0.12:5173`).
3. Verifique:
   - Sensibilidade do gesto de arrastar para controlar a cobra.
   - Feedback ao toque nos botões virtuais (vibração/haptic quando disponível).
   - Se a orientação automática da página responde instantaneamente ao girar o dispositivo.
   - Performance: ausência de engasgos ao aumentar a densidade de comida ou acelerar a cobra.
4. Registre capturas de tela/fotos de cada dispositivo e anote comportamentos específicos (por exemplo, barras de navegação que ocupam espaço extra, diferenças de safe-area, atraso de áudio, etc.).

## 4. Comportamentos esperados por categoria de tela

- **Desktop (≥ 1024px):**
  - `game-wrapper` com bordas arredondadas, sombra e HUD em coluna à esquerda.
  - Controles móveis nunca visíveis.
  - Overlay inicial com título centralizado em animação suave.

- **Paisagem < 900px:**
  - `game-wrapper` expande para `100vw × 100vh` com bordas removidas.
  - HUD reposicionada para o topo, em linha, com fundo translúcido.
  - Controles móveis visíveis, alinhados na borda inferior esquerda, respeitando `safe-area`.
  - Transições suaves ao entrar/sair do overlay de game over.

- **Paisagem < 680px:**
  - Espaçamento da HUD reduzido e tipografia ajustada via `clamp`.
  - Controles móveis permanecem utilizáveis sem sobrepor o canvas.

- **Retrato < 900px:**
  - Canvas é desfocado e inativo; `orientation-overlay` ocupa a tela instruindo o usuário a girar o dispositivo.
  - Controles móveis ocultos à força (`display: none !important`).

## 5. Lista de verificação de regressão

- [ ] O layout desktop (≥ 1024px) mantém bordas, sombras e HUD em coluna.
- [ ] Breakpoint de 900px alterna corretamente entre layout desktop e tela cheia mobile.
- [ ] A `orientation-overlay` surge somente em modo retrato com largura < 900px e desaparece ao retornar ao modo paisagem.
- [ ] Controles móveis aparecem apenas quando `window.innerWidth < 901` em modo paisagem.
- [ ] Gestos de toque e botões virtuais direcionam a cobra corretamente sem atraso.
- [ ] A HUD permanece legível (tipografia e espaçamentos) em 680px e 768px.
- [ ] Overlays de início e game over mantêm centralização e animação suave em todos os tamanhos.
- [ ] O áudio reproduz e interrompe sem estalos após alternar orientação ou reiniciar o jogo.
- [ ] Não há regressões de performance perceptíveis ao aumentar a duração da partida em dispositivos médios.
- [ ] Nenhum elemento crítico fica inacessível ao exibir barras de navegação móveis (safe-area respeitado).

## 6. Registro de resultados

Monte um log por rodada de testes contendo:

- Data, commit testado e testador responsável.
- Dispositivos/emuledores utilizados, versão de SO/navegador.
- Observações de comportamento esperado vs. observado.
- Anexos (capturas de tela, vídeos curtos ou métricas de FPS quando disponíveis).
- Itens de regressão encontrados (se houver) vinculados a issues no tracker.

Seguir este processo ajudará a manter o modo desktop intacto enquanto evoluímos a experiência mobile do jogo.
