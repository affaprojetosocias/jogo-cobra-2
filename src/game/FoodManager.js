import { GameConfig } from './GameConfig.js';
import { Food } from './Food.js';

// Gerencia a criação, atualização e consumo dos itens de comida no mapa.
export class FoodManager {
  constructor(arena) {
    this.arena = arena;
    this.foodItems = [];
    this.lastSpawnTime = 0;
    this.targetFoodCount = GameConfig.maxFoodItems;
    for (let i = 0; i < this.targetFoodCount; i++) {
      this.spawnFood();
    }
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
          snake.grow();
          this.lastSpawnTime = time;
          events.push({ snake, food });
          break;
        }
      }
    }

    const activeFood = this.foodItems.filter((food) => !food.collected).length;
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
    const food = new Food({ x, y });
    this.foodItems.push(food);
    this.lastSpawnTime = performance.now() / 1000;
  }
}
