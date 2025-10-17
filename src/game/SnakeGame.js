import { Snake } from './Snake.js';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { FoodManager } from './FoodManager.js';
import { AudioManager } from './AudioManager.js';
import { AISnake } from './AISnake.js';
import { GameConfig } from './GameConfig.js';

// Camada principal que integra todos os componentes e controla o ciclo do jogo.
export class SnakeGame {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.audio = new AudioManager();

    this.state = 'waiting';
    this.playerSnake = null;
    this.aiSnakes = [];
    this.snakes = [];
    this.foodManager = null;
    this.animationFrame = null;
    this.lastTime = 0;
    this.elapsedTime = 0;
    this.score = 0;
    this.highScore = Number(localStorage.getItem('snake_highscore') || 0);
    this.arena = { width: GameConfig.worldWidth, height: GameConfig.worldHeight };
    this.camera = { x: 0, y: 0, width: canvas.clientWidth, height: canvas.clientHeight };

    this.handleResize = this.handleResize.bind(this);
    this.handleStartInput = this.handleStartInput.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.restart = this.restart.bind(this);
    ui.highscoreValue.textContent = this.highScore.toString();
    ui.restartButton.addEventListener('click', this.restart);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas.parentElement);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
    window.addEventListener('viewportmetricschange', this.handleResize);
    this.handleResize();
  }

  // Inicializa eventos de entrada e exibe a mensagem inicial.
  init() {
    this.input.attach();
    this.setupStartListeners();
  }

  setupStartListeners() {
    window.addEventListener('keydown', this.handleStartInput, { once: true });
    this.canvas.addEventListener('pointerdown', this.handleStartInput, { once: true });
    if (this.ui.startOverlay) {
      this.ui.startOverlay.addEventListener('pointerdown', this.handleStartInput, { once: true });
      this.ui.startOverlay.addEventListener('click', this.handleStartInput, { once: true });
    }
  }

  handleResize() {
    const viewport = this.getViewportSize();
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);

    this.renderer = new Renderer(this.canvas);
    this.renderer.resize(width, height);
    this.camera.width = width;
    this.camera.height = height;
    this.calculateArenaDimensions(viewport.width, viewport.height);
    if (this.foodManager) {
      this.foodManager.syncWithArena();
    }
    this.updateCamera(true);
  }

  calculateArenaDimensions(viewportWidth, viewportHeight) {
    const fallbackWidth = this.canvas.clientWidth || viewportWidth;
    const fallbackHeight = this.canvas.clientHeight || viewportHeight;
    const safeWidth = viewportWidth || fallbackWidth;
    const safeHeight = viewportHeight || fallbackHeight;
    const longSide = Math.max(safeWidth, safeHeight);
    const shortSide = Math.max(Math.min(safeWidth, safeHeight), 480);

    const widthScale = longSide / 900;
    const heightScale = shortSide / 700;

    let targetWidth = clamp(
      Math.round(GameConfig.worldWidth * widthScale),
      GameConfig.worldMinWidth,
      GameConfig.worldMaxWidth
    );
    let targetHeight = clamp(
      Math.round(GameConfig.worldHeight * heightScale),
      GameConfig.worldMinHeight,
      GameConfig.worldMaxHeight
    );

    if (this.snakes && this.snakes.length > 0) {
      let maxX = 0;
      let maxY = 0;
      for (const snake of this.snakes) {
        for (const segment of snake.getSegments()) {
          if (segment.x > maxX) maxX = segment.x;
          if (segment.y > maxY) maxY = segment.y;
        }
      }
      if (this.foodManager) {
        for (const food of this.foodManager.foodItems) {
          if (food.collected) continue;
          if (food.position.x > maxX) maxX = food.position.x;
          if (food.position.y > maxY) maxY = food.position.y;
        }
      }
      const paddedWidth = maxX + GameConfig.arenaPadding;
      const paddedHeight = maxY + GameConfig.arenaPadding;
      targetWidth = Math.min(GameConfig.worldMaxWidth, Math.max(targetWidth, paddedWidth));
      targetHeight = Math.min(GameConfig.worldMaxHeight, Math.max(targetHeight, paddedHeight));
    }

    const minimumWidth = Math.max(safeWidth, this.camera.width);
    const minimumHeight = Math.max(safeHeight, this.camera.height);
    this.arena.width = Math.max(targetWidth, minimumWidth);
    this.arena.height = Math.max(targetHeight, minimumHeight);
  }

  getViewportSize() {
    const docStyles = getComputedStyle(document.documentElement);
    const widthValue = docStyles.getPropertyValue('--app-width').trim();
    const heightValue = docStyles.getPropertyValue('--app-height').trim();
    const viewport = window.visualViewport;
    const fallbackWidth = Math.max(
      Math.round(viewport ? viewport.width : window.innerWidth || this.canvas.clientWidth || 0),
      1
    );
    const fallbackHeight = Math.max(
      Math.round(viewport ? viewport.height : window.innerHeight || this.canvas.clientHeight || 0),
      1
    );
    const widthCandidate = parseFloat(widthValue);
    const heightCandidate = parseFloat(heightValue);
    const hasPixelWidth =
      Number.isFinite(widthCandidate) && widthCandidate > 0 && widthValue.endsWith('px');
    const hasPixelHeight =
      Number.isFinite(heightCandidate) && heightCandidate > 0 && heightValue.endsWith('px');
    const width = hasPixelWidth ? Math.max(Math.round(widthCandidate), 1) : fallbackWidth;
    const height = hasPixelHeight ? Math.max(Math.round(heightCandidate), 1) : fallbackHeight;
    return { width, height };
  }

  // Inicializa uma nova partida resetando estados e criando entidades.
  startMatch() {
    const center = { x: this.arena.width / 2, y: this.arena.height / 2 };
    this.playerSnake = new Snake({ x: center.x, y: center.y, color: '#ff8dc7' });
    this.aiSnakes = this.createAISnakes();
    this.snakes = [this.playerSnake, ...this.aiSnakes];
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
    this.updateCamera(true);
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
      this.setupStartListeners();
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
    if (this.playerSnake) {
      const head = this.playerSnake.headPosition;
      const anchorX = head.x - this.camera.x;
      const anchorY = head.y - this.camera.y;
      this.input.setPointerAnchor(anchorX, anchorY);
    }

    const angle = this.input.getTargetAngle();
    this.playerSnake.steerTowards(angle);
    this.playerSnake.update(dt);

    for (const aiSnake of this.aiSnakes) {
      aiSnake.updateAI(dt, now, {
        foods: this.foodManager.foodItems,
        snakes: this.snakes,
        arena: this.arena,
      });
    }

    const events = this.foodManager.update(dt, now, this.snakes);
    let collectedScore = 0;
    for (const event of events) {
      if (event.snake === this.playerSnake) {
        collectedScore += event.food.score;
      }
    }
    if (collectedScore > 0) {
      this.score += collectedScore;
      this.audio.playCollect();
    }

    this.updateCamera();
    const drawOrder = [...this.aiSnakes, this.playerSnake];
    this.renderer.draw(this.arena, drawOrder, this.foodManager.foodItems, now, this.camera);
    this.updateUI();

    if (this.detectPlayerCollisions()) {
      this.endGame();
    }
  }

  createAISnakes() {
    const snakes = [];
    const targetCount = this.getAISnakeCount();
    for (let i = 0; i < targetCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spreadRadius = Math.min(this.arena.width, this.arena.height) * 0.35;
      const minRadius = Math.min(this.arena.width, this.arena.height) * 0.18;
      const distance = minRadius + Math.random() * (spreadRadius - minRadius);
      const startX = clamp(
        this.arena.width / 2 + Math.cos(angle) * distance,
        GameConfig.arenaPadding,
        this.arena.width - GameConfig.arenaPadding
      );
      const startY = clamp(
        this.arena.height / 2 + Math.sin(angle) * distance,
        GameConfig.arenaPadding,
        this.arena.height - GameConfig.arenaPadding
      );
      const color = GameConfig.aiColors[i % GameConfig.aiColors.length];
      const snake = new AISnake({ x: startX, y: startY, color });
      snakes.push(snake);
    }
    return snakes;
  }

  // Verifica colisões com bordas e com outras cobras.
  detectPlayerCollisions() {
    const head = this.playerSnake.headPosition;
    if (
      head.x < this.playerSnake.radius ||
      head.x > this.arena.width - this.playerSnake.radius ||
      head.y < this.playerSnake.radius ||
      head.y > this.arena.height - this.playerSnake.radius
    ) {
      return true;
    }

    if (this.playerSnake.checkSelfCollision()) {
      return true;
    }

    for (const snake of this.aiSnakes) {
      for (const segment of snake.getSegments()) {
        const dx = head.x - segment.x;
        const dy = head.y - segment.y;
        const combined = this.playerSnake.radius + snake.radius * 0.8;
        if (dx * dx + dy * dy < combined * combined) {
          return true;
        }
      }
    }

    return false;
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
    this.setMobileControlsVisibility(false);
  }

  getAISnakeCount() {
    const areaFactor = (this.arena.width * this.arena.height) / 100000;
    const densityCount = Math.round(areaFactor * GameConfig.aiDensity);
    const desired = Math.max(GameConfig.aiSnakeCount, densityCount);
    return clamp(desired, GameConfig.aiSnakeCount, GameConfig.aiMaxCount);
  }

  updateCamera(force = false) {
    if (!this.playerSnake) {
      return;
    }
    const head = this.playerSnake.headPosition;
    const maxX = Math.max(this.arena.width - this.camera.width, 0);
    const maxY = Math.max(this.arena.height - this.camera.height, 0);
    const targetX = clamp(head.x - this.camera.width / 2, 0, maxX);
    const targetY = clamp(head.y - this.camera.height / 2, 0, maxY);

    if (force) {
      this.camera.x = targetX;
      this.camera.y = targetY;
    } else {
      this.camera.x += (targetX - this.camera.x) * 0.12;
      this.camera.y += (targetY - this.camera.y) * 0.12;
    }
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
