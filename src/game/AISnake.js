import { Snake } from './Snake.js';
import { GameConfig } from './GameConfig.js';

// Controla o comportamento das cobras controladas pela IA.
export class AISnake extends Snake {
  constructor(options = {}) {
    super(options);
    this.targetFood = null;
    this.lastRetarget = 0;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.turnSpeed *= 0.85; // torna curvas mais suaves para a IA
    this.speed *= 0.92;
  }

  updateAI(dt, time, context) {
    const { foods, snakes, arena } = context;
    this.selectFoodTarget(time, foods);

    const targetVector = this.computeFoodVector();
    const avoidanceVector = this.computeAvoidance(snakes);
    const boundaryVector = this.computeBoundaryAvoidance(arena);
    const wanderVector = this.computeWander(dt);

    const desired = combineVectors([targetVector, avoidanceVector, boundaryVector, wanderVector]);
    const angle = Math.atan2(desired.y, desired.x);
    this.steerTowards(angle);
    super.update(dt);
  }

  selectFoodTarget(time, foods) {
    const needRetarget =
      !this.targetFood ||
      this.targetFood.collected ||
      time - this.lastRetarget > GameConfig.aiRetargetDelay;

    if (!needRetarget) {
      return;
    }

    let closest = null;
    let closestDist = Infinity;
    for (const food of foods) {
      if (food.collected) continue;
      const dx = food.position.x - this.headPosition.x;
      const dy = food.position.y - this.headPosition.y;
      const dist = dx * dx + dy * dy;
      if (dist < closestDist) {
        closestDist = dist;
        closest = food;
      }
    }
    this.targetFood = closest;
    this.lastRetarget = time;
  }

  computeFoodVector() {
    if (!this.targetFood || this.targetFood.collected) {
      return { x: 0, y: 0 };
    }
    const dx = this.targetFood.position.x - this.headPosition.x;
    const dy = this.targetFood.position.y - this.headPosition.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  computeAvoidance(snakes) {
    let ax = 0;
    let ay = 0;
    const detectionRadius = GameConfig.aiAvoidanceRadius;
    const detectionSq = detectionRadius * detectionRadius;

    for (const snake of snakes) {
      if (snake === this) continue;
      for (let i = 0; i < snake.getSegments().length; i += 3) {
        const segment = snake.getSegments()[i];
        const dx = this.headPosition.x - segment.x;
        const dy = this.headPosition.y - segment.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < detectionSq) {
          const dist = Math.sqrt(distSq) || 1;
          const strength = (1 - dist / detectionRadius) * GameConfig.aiAvoidanceStrength;
          ax += (dx / dist) * strength;
          ay += (dy / dist) * strength;
        }
      }
    }

    const length = Math.hypot(ax, ay);
    if (length === 0) {
      return { x: 0, y: 0 };
    }
    return { x: ax / length, y: ay / length };
  }

  computeBoundaryAvoidance(arena) {
    const padding = GameConfig.arenaPadding * 0.75;
    const influence = GameConfig.aiAvoidanceStrength * 0.7;
    let vx = 0;
    let vy = 0;

    if (this.headPosition.x < padding) {
      vx += influence;
    } else if (this.headPosition.x > arena.width - padding) {
      vx -= influence;
    }

    if (this.headPosition.y < padding) {
      vy += influence;
    } else if (this.headPosition.y > arena.height - padding) {
      vy -= influence;
    }

    if (vx === 0 && vy === 0) {
      return { x: 0, y: 0 };
    }

    const length = Math.hypot(vx, vy) || 1;
    return { x: vx / length, y: vy / length };
  }

  computeWander(dt) {
    this.wanderAngle += (Math.random() - 0.5) * GameConfig.aiWanderStrength;
    const ax = Math.cos(this.wanderAngle);
    const ay = Math.sin(this.wanderAngle);
    return { x: ax, y: ay };
  }
}

function combineVectors(vectors) {
  let x = 0;
  let y = 0;
  for (const vec of vectors) {
    x += vec.x;
    y += vec.y;
  }
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}
