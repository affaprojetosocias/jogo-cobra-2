import { Snake } from './Snake.js';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { FoodManager } from './FoodManager.js';
import { AudioManager } from './AudioManager.js';

// Camada principal que integra todos os componentes e controla o ciclo do jogo.
export class SnakeGame {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.audio = new AudioManager();

    this.state = 'waiting';
    this.snake = null;
    this.foodManager = null;
    this.animationFrame = null;
    this.lastTime = 0;
    this.elapsedTime = 0;
    this.score = 0;
    this.highScore = Number(localStorage.getItem('snake_highscore') || 0);
    this.arena = { width: 800, height: 600 };

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas.parentElement);
    this.handleResize();

    this.handleStartInput = this.handleStartInput.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.restart = this.restart.bind(this);

    ui.highscoreValue.textContent = this.highScore.toString();
    ui.restartButton.addEventListener('click', this.restart);
  }

  // Inicializa eventos de entrada e exibe a mensagem inicial.
  init() {
    this.input.attach();
    window.addEventListener('keydown', this.handleStartInput, { once: true });
    this.canvas.addEventListener('pointerdown', this.handleStartInput, { once: true });
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.arena.width = rect.width;
    this.arena.height = rect.height;
    this.renderer = new Renderer(this.canvas);
    this.renderer.resize(rect.width, rect.height);
    if (this.snake) {
      // reposiciona snake no centro da arena ao redimensionar
      const center = { x: rect.width / 2, y: rect.height / 2 };
      this.snake.getSegments().forEach((segment, index) => {
        segment.x = center.x - index * 8;
        segment.y = center.y;
      });
    }
  }

  // Inicializa uma nova partida resetando estados e criando entidades.
  startMatch() {
    const center = { x: this.arena.width / 2, y: this.arena.height / 2 };
    this.snake = new Snake({ x: center.x, y: center.y, color: '#ff8dc7' });
    this.foodManager = new FoodManager(this.arena);
    this.score = 0;
    this.elapsedTime = 0;
    this.lastTime = performance.now() / 1000;
    this.state = 'running';
    this.ui.scoreValue.textContent = '0';
    this.ui.timeValue.textContent = '00:00';
    this.ui.startOverlay.classList.remove('visible');
    this.ui.gameOverOverlay.classList.remove('visible');
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(this.gameLoop);
  }

  handleStartInput(event) {
    event.preventDefault();
    if (this.state === 'waiting') {
      this.startMatch();
    }
  }

  // Reinicia após o término do jogo sem recarregar a página.
  restart() {
    if (this.state !== 'waiting') {
      this.state = 'waiting';
      this.ui.startOverlay.classList.add('visible');
      this.ui.gameOverOverlay.classList.remove('visible');
      window.addEventListener('keydown', this.handleStartInput, { once: true });
      this.canvas.addEventListener('pointerdown', this.handleStartInput, { once: true });
    }
  }

  updateUI() {
    this.ui.scoreValue.textContent = this.score.toString();
    this.ui.timeValue.textContent = formatTime(this.elapsedTime);
    this.ui.highscoreValue.textContent = this.highScore.toString();
  }

  // Ciclo principal do jogo executado a cada frame.
  gameLoop(timestamp) {
    this.animationFrame = requestAnimationFrame(this.gameLoop);
    const now = timestamp / 1000;
    const dt = Math.min(now - this.lastTime, 0.05);
    this.lastTime = now;

    if (this.state !== 'running') {
      return;
    }

    this.elapsedTime += dt;
    const angle = this.input.getTargetAngle();
    this.snake.steerTowards(angle);
    this.snake.update(dt);

    const collected = this.foodManager.update(dt, now, this.snake);
    if (collected) {
      this.score += 10;
      this.audio.playCollect();
    }

    this.renderer.draw(this.arena, this.snake, this.foodManager.foodItems, now);
    this.updateUI();

    if (this.detectCollisions()) {
      this.endGame();
    }
  }

  // Verifica colisões com bordas e com o próprio corpo.
  detectCollisions() {
    const head = this.snake.headPosition;
    if (
      head.x < 0 + this.snake.radius ||
      head.x > this.arena.width - this.snake.radius ||
      head.y < 0 + this.snake.radius ||
      head.y > this.arena.height - this.snake.radius
    ) {
      return true;
    }
    return this.snake.checkSelfCollision();
  }

  // Encerramento da rodada com exibição de overlay e sons.
  endGame() {
    this.state = 'gameover';
    cancelAnimationFrame(this.animationFrame);
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snake_highscore', this.highScore.toString());
    }
    this.audio.playGameOver();
    this.ui.finalScore.textContent = this.score.toString();
    this.ui.gameOverOverlay.classList.add('visible');
  }
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const secs = (total % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
