import { SnakeGame } from './game/SnakeGame.js';

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
  mobileControls: document.getElementById('mobile-controls'),
  mobileButtons: document.querySelectorAll('#mobile-controls [data-direction]'),
};

const game = new SnakeGame(canvas, ui);
game.init();
