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

  clear(camera) {
    const ctx = this.ctx;
    ctx.fillStyle = GameConfig.arenaColor;
    ctx.fillRect(0, 0, camera.width, camera.height);

    // Desenha linhas suaves de grade alinhadas com o mundo.
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const startX = Math.floor(camera.x / GameConfig.gridSize) * GameConfig.gridSize;
    const endX = camera.x + camera.width;
    for (let x = startX; x <= endX; x += GameConfig.gridSize) {
      const screenX = x - camera.x;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, camera.height);
      ctx.stroke();
    }

    const startY = Math.floor(camera.y / GameConfig.gridSize) * GameConfig.gridSize;
    const endY = camera.y + camera.height;
    for (let y = startY; y <= endY; y += GameConfig.gridSize) {
      const screenY = y - camera.y;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(camera.width, screenY);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFood(foodItems, time, camera) {
    const ctx = this.ctx;
    for (const food of foodItems) {
      const radius = food.getAnimatedRadius(time);
      const fx = food.position.x - camera.x;
      const fy = food.position.y - camera.y;
      const colors = food.getColors();
      const gradient = ctx.createRadialGradient(fx, fy, radius * 0.28, fx, fy, radius);
      gradient.addColorStop(0, colors.inner);
      gradient.addColorStop(0.5, colors.mid);
      gradient.addColorStop(1, colors.outer);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(fx, fy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Desenha partículas residuais.
      for (const particle of food.particles) {
        const px = particle.x - camera.x;
        const py = particle.y - camera.y;
        ctx.fillStyle = particle.color || colors.mid;
        ctx.beginPath();
        ctx.arc(px, py, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawSnake(snake, camera) {
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

      const gradient = ctx.createLinearGradient(
        current.x - camera.x,
        current.y - camera.y,
        next.x - camera.x,
        next.y - camera.y
      );
      gradient.addColorStop(0, 'rgba(120, 115, 245, 0.35)');
      gradient.addColorStop(1, snake.color);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(current.x - camera.x, current.y - camera.y);
      ctx.lineTo(next.x - camera.x, next.y - camera.y);
      ctx.stroke();
    }

    // Cabeça com destaque brilhante.
    const head = segments[0];
    const eyeOffset = { x: Math.cos(snake.direction) * 6, y: Math.sin(snake.direction) * 6 };
    const hx = head.x - camera.x;
    const hy = head.y - camera.y;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx, hy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = snake.color;
    ctx.beginPath();
    ctx.arc(hx + eyeOffset.x, hy + eyeOffset.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  draw(arena, snakes, foodItems, time, camera) {
    this.clear(camera);
    this.drawFood(foodItems, time, camera);
    for (const snake of snakes) {
      this.drawSnake(snake, camera);
    }
  }
}
