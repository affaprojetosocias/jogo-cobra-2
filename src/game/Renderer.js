import { GameConfig } from './GameConfig.js';

// Responsável por desenhar todos os elementos no canvas com efeitos visuais modernos.
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.devicePixelRatio = window.devicePixelRatio || 1;
  }

  // Ajusta o canvas ao tamanho da janela mantendo nitidez em telas retina.
  resize(width, height) {
    const ratio = this.devicePixelRatio;
    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(ratio, ratio);
  }

  clear(arena) {
    const ctx = this.ctx;
    ctx.fillStyle = GameConfig.arenaColor;
    ctx.fillRect(0, 0, arena.width, arena.height);

    // Desenha linhas suaves de grade para sensação futurista.
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < arena.width; x += GameConfig.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, arena.height);
      ctx.stroke();
    }
    for (let y = 0; y < arena.height; y += GameConfig.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(arena.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFood(foodItems, time) {
    const ctx = this.ctx;
    for (const food of foodItems) {
      const radius = food.getAnimatedRadius(time);
      const gradient = ctx.createRadialGradient(
        food.position.x,
        food.position.y,
        radius * 0.3,
        food.position.x,
        food.position.y,
        radius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.4, 'rgba(255, 200, 80, 0.9)');
      gradient.addColorStop(1, 'rgba(255, 80, 160, 0.0)');

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(food.position.x, food.position.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Desenha partículas residuais.
      ctx.fillStyle = 'rgba(255, 220, 150, 0.8)';
      for (const particle of food.particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawSnake(snake) {
    const ctx = this.ctx;
    const segments = snake.getSegments();

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Corpo da cobra com efeito gradiente.
    for (let i = segments.length - 1; i > 0; i--) {
      const current = segments[i];
      const next = segments[i - 1];
      const progress = i / segments.length;
      const width = 10 + Math.sin(progress * Math.PI) * 6;

      const gradient = ctx.createLinearGradient(current.x, current.y, next.x, next.y);
      gradient.addColorStop(0, 'rgba(120, 115, 245, 0.4)');
      gradient.addColorStop(1, snake.color);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }

    // Cabeça com destaque brilhante.
    const head = segments[0];
    const eyeOffset = { x: Math.cos(snake.direction) * 6, y: Math.sin(snake.direction) * 6 };
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = snake.color;
    ctx.beginPath();
    ctx.arc(head.x + eyeOffset.x, head.y + eyeOffset.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  draw(arena, snake, foodItems, time) {
    this.clear(arena);
    this.drawFood(foodItems, time);
    this.drawSnake(snake);
  }
}
