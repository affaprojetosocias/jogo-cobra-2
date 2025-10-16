import { GameConfig } from './GameConfig.js';
import { Food } from './Food.js';

// Gerencia a criação, atualização e consumo dos itens de comida no mapa.
export class FoodManager {
  constructor(arena) {
    this.arena = arena;
    this.foodItems = [];
    this.lastSpawnTime = 0;
  }

  // Atualiza comida existente e garante que sempre exista ao menos um item disponível.
  update(dt, time, snake) {
    this.foodItems.forEach((food) => food.update(dt));

    // Remove partículas de comidas já coletadas.
    this.foodItems = this.foodItems.filter((food) => !food.collected || food.particles.length > 0);

    // Força aparecimento de nova comida se estiver demorando demais.
    if ((time - this.lastSpawnTime > GameConfig.foodSpawnInterval && this.foodItems.length === 0) || this.foodItems.every((f) => f.collected)) {
      this.spawnFood();
    }

    // Garante pelo menos um item no mapa.
    if (this.foodItems.length === 0) {
      this.spawnFood();
    }

    // Detecta coleta pela cobra.
    for (const food of this.foodItems) {
      if (food.collected) continue;
      const head = snake.headPosition;
      const dx = head.x - food.position.x;
      const dy = head.y - food.position.y;
      const radius = food.baseRadius + snake.radius;
      if (dx * dx + dy * dy < radius * radius) {
        food.collected = true;
        food.burst();
        this.lastSpawnTime = time;
        snake.grow();
        this.spawnFood();
        return food; // retorna item coletado para acionarmos feedback externo
      }
    }

    return null;
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
