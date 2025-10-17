import { SnakeGame } from './game/SnakeGame.js';

const rootStyle = document.documentElement.style;

const updateViewportMetrics = () => {
  const viewport = window.visualViewport;
  const width = Math.round(viewport ? viewport.width : window.innerWidth || 0);
  const height = Math.round(viewport ? viewport.height : window.innerHeight || 0);
  const offsetLeft = viewport ? Math.round(viewport.offsetLeft) : 0;
  const offsetTop = viewport ? Math.round(viewport.offsetTop) : 0;
  const offsetRight = viewport
    ? Math.round(Math.max(window.innerWidth - width - viewport.offsetLeft, 0))
    : 0;
  const offsetBottom = viewport
    ? Math.round(Math.max(window.innerHeight - height - viewport.offsetTop, 0))
    : 0;

  rootStyle.setProperty('--app-width', `${Math.max(width, 0)}px`);
  rootStyle.setProperty('--app-height', `${Math.max(height, 0)}px`);
  rootStyle.setProperty('--safe-area-top', `${Math.max(offsetTop, 0)}px`);
  rootStyle.setProperty('--safe-area-right', `${Math.max(offsetRight, 0)}px`);
  rootStyle.setProperty('--safe-area-bottom', `${Math.max(offsetBottom, 0)}px`);
  rootStyle.setProperty('--safe-area-left', `${Math.max(offsetLeft, 0)}px`);

  window.dispatchEvent(
    new CustomEvent('viewportmetricschange', { detail: { width, height } })
  );
};

const setupViewportObservers = () => {
  let rafId = null;
  const scheduleUpdate = () => {
    if (rafId !== null) {
      return;
    }
    rafId = requestAnimationFrame(() => {
      rafId = null;
      updateViewportMetrics();
    });
  };

  updateViewportMetrics();
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('orientationchange', scheduleUpdate);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleUpdate);
    window.visualViewport.addEventListener('scroll', scheduleUpdate);
  }
};

setupViewportObservers();

// Localiza elementos da interface e inicializa o jogo.
const canvas = document.getElementById('game-canvas');
const ui = {
  scoreValue: document.getElementById('score-value'),
  timeValue: document.getElementById('time-value'),
  highscoreValue: document.getElementById('highscore-value'),
  startOverlay: document.getElementById('start-overlay'),
  gameOverOverlay: document.getElementById('gameover-overlay'),
  finalScore: document.getElementById('final-score'),
  restartButton: document.getElementById('restart-button'),
};

const game = new SnakeGame(canvas, ui);
game.init();
