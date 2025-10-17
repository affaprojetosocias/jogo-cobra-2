import { GameConfig } from './GameConfig.js';

// Representa uma cobra com movimento suave controlado por ângulo e velocidade.
export class Snake {
  constructor({ x, y, color }) {
    this.head = { x, y };
    this.direction = 0; // ângulo em radianos
    this.targetDirection = 0;
    this.speed = GameConfig.baseSpeed;
    this.color = color;
    this.segments = [];
    this.radius = 8;
    this.turnSpeed = 5.2; // velocidade de rotação (rad/s)
    this.growQueued = 0;

    // Cria um corpo inicial suavemente espaçado.
    for (let i = 0; i < GameConfig.initialLength; i++) {
      this.segments.push({ x: x - i * GameConfig.segmentSpacing, y });
    }
  }

  // Retorna o primeiro segmento (cabeça) para facilitar cálculos.
  get headPosition() {
    return this.segments[0];
  }

  // Define a direção alvo recebida do controle (teclado ou toque).
  steerTowards(angle) {
    this.targetDirection = angle;
  }

  // Aumenta levemente a velocidade e agenda crescimento do corpo.
  grow(segments = GameConfig.defaultGrowthSegments) {
    this.growQueued += segments; // adiciona múltiplos segmentos para crescimento suave
    const ratio = segments / GameConfig.defaultGrowthSegments;
    this.speed += GameConfig.speedGrowthFactor * ratio;
  }

  // Atualiza posição, suaviza rotação e aplica espaçamento entre segmentos.
  update(dt) {
    // Ajuste gradual da direção para evitar viradas bruscas.
    const angleDiff = normalizeAngle(this.targetDirection - this.direction);
    const maxTurn = this.turnSpeed * dt;
    const clampedTurn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
    this.direction = normalizeAngle(this.direction + clampedTurn);

    // Calcula novo ponto da cabeça com base na velocidade atual.
    const moveDist = this.speed * dt;
    const head = this.segments[0];
    head.x += Math.cos(this.direction) * moveDist;
    head.y += Math.sin(this.direction) * moveDist;

    // Move cada segmento em direção ao anterior preservando espaçamento consistente.
    for (let i = 1; i < this.segments.length; i++) {
      const prev = this.segments[i - 1];
      const current = this.segments[i];
      const dx = prev.x - current.x;
      const dy = prev.y - current.y;
      const distance = Math.hypot(dx, dy) || 0.0001;
      const desired = GameConfig.segmentSpacing;
      const ratio = (distance - desired) / distance;
      current.x += dx * ratio;
      current.y += dy * ratio;
    }

    // Adiciona novos segmentos na cauda quando necessário.
    while (this.growQueued > 0) {
      const tail = this.segments[this.segments.length - 1];
      this.segments.push({ x: tail.x, y: tail.y });
      this.growQueued--;
    }
  }

  // Retorna true caso a cabeça colida com um ponto do corpo (ignorando primeiros segmentos para evitar falso positivo).
  checkSelfCollision() {
    const head = this.segments[0];
    for (let i = 4; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const dx = head.x - segment.x;
      const dy = head.y - segment.y;
      if (dx * dx + dy * dy < (this.radius - 2) ** 2) {
        return true;
      }
    }
    return false;
  }

  // Fornece os pontos do corpo para renderização e colisão externa.
  getSegments() {
    return this.segments;
  }
}

function normalizeAngle(angle) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
