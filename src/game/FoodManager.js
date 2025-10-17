import { GameConfig } from './GameConfig.js';
import { Food } from './Food.js';

// Gerencia a criação, atualização e consumo dos itens de comida no mapa.
export class FoodManager {
  constructor(arena) {
    this.arena = arena;
    this.foodItems = [];
    this.lastSpawnTime = 0;
    this.targetFoodCount = 0;
    this.recalculateTarget();
    this.populateInitialFood();
  }

  populateInitialFood() {
    for (let i = 0; i < this.targetFoodCount; i++) {
      this.spawnFood();
    }
  }

  recalculateTarget() {
    const areaFactor = (this.arena.width * this.arena.height) / 100000;
    const densityTarget = Math.round(areaFactor * GameConfig.foodDensity);
    const bounded = Math.min(GameConfig.foodMaxCount, densityTarget);
    this.targetFoodCount = Math.max(GameConfig.maxFoodItems, bounded);
  }

  syncWithArena() {
    const previous = this.targetFoodCount;
    this.recalculateTarget();
    if (this.targetFoodCount > previous) {
      const missing = this.targetFoodCount - this.getActiveFoodCount();
      for (let i = 0; i < missing; i++) {
        this.spawnFood();
      }
    } else if (this.targetFoodCount < previous) {
      const active = this.getActiveFoodCount();
      const excess = Math.max(0, active - this.targetFoodCount);
      if (excess > 0) {
        let removed = 0;
        this.foodItems = this.foodItems.filter((food) => {
          if (!food.collected && removed < excess) {
            removed++;
            return false;
          }
          return true;
        });
      }
    }
  }

  getActiveFoodCount() {
    return this.foodItems.filter((food) => !food.collected).length;
  }

  // Atualiza comida existente e garante que sempre exista uma grande variedade no cenário.
  update(dt, time, snakes) {
    this.foodItems.forEach((food) => food.update(dt));

    // Remove partículas de comidas já coletadas.
    this.foodItems = this.foodItems.filter((food) => !food.collected || food.particles.length > 0);

    const events = [];
    for (const snake of snakes) {
      for (const food of this.foodItems) {
        if (food.collected) continue;
        const head = snake.headPosition;
        const dx = head.x - food.position.x;
        const dy = head.y - food.position.y;
        const radius = food.baseRadius + snake.radius;
        if (dx * dx + dy * dy < radius * radius) {
          food.collected = true;
          food.burst();
          snake.grow(food.growthSegments);
          this.lastSpawnTime = time;
          events.push({ snake, food });
          break;
        }
      }
    }

    this.recalculateTarget();
    const activeFood = this.getActiveFoodCount();
    if (activeFood < this.targetFoodCount) {
      const missing = this.targetFoodCount - activeFood;
      for (let i = 0; i < missing; i++) {
        this.spawnFood();
      }
    } else if (time - this.lastSpawnTime > GameConfig.foodSpawnInterval && activeFood === 0) {
      this.spawnFood();
    }

    return events;
  }

  // Sorteia posição dentro do espaço da arena.
  spawnFood() {
    const x = GameConfig.arenaPadding + Math.random() * (this.arena.width - GameConfig.arenaPadding * 2);
    const y = GameConfig.arenaPadding + Math.random() * (this.arena.height - GameConfig.arenaPadding * 2);
    const type = Math.random() < GameConfig.foodLargeChance ? 'large' : 'small';
    const food = new Food({ x, y, type });
    this.foodItems.push(food);
    this.lastSpawnTime = performance.now() / 1000;
  }
}
