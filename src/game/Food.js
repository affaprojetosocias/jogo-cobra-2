import { GameConfig } from './GameConfig.js';

// Representa um item de comida com animação pulsante e partículas ao ser coletado.
export class Food {
  constructor({ x, y, type }) {
    this.position = { x, y };
    this.type = type;
    this.config = GameConfig.foodTypes[type] || GameConfig.foodTypes.small;
    this.baseRadius = this.config.baseRadius;
    this.growthSegments = this.config.growthSegments;
    this.score = this.config.score;
    this.pulseSpeed = this.config.pulseSpeed;
    this.spawnTime = performance.now() / 1000;
    this.collected = false;
    this.particles = [];
  }

  // Atualiza partículas geradas após coleta.
  update(dt) {
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      return p.life > 0;
    });
  }

  // Gera partículas coloridas para feedback visual.
  burst() {
    for (let i = 0; i < GameConfig.particleCount; i++) {
      this.particles.push({
        x: this.position.x,
        y: this.position.y,
        angle: Math.random() * Math.PI * 2,
        speed: 60 + Math.random() * 80,
        life: GameConfig.particleTTL,
        radius: 2 + Math.random() * 2,
        color: this.config.colors.particle,
      });
    }
  }

  // Raio animado para dar a sensação de pulsação.
  getAnimatedRadius(time) {
    const pulse = Math.sin((time - this.spawnTime) * this.pulseSpeed) * 1.5;
    return this.baseRadius + pulse;
  }

  getColors() {
    return this.config.colors;
  }
}
