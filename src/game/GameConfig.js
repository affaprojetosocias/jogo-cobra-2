// Configurações globais do jogo para centralizar constantes reutilizadas.
export const GameConfig = {
  baseSpeed: 120, // velocidade base da cobra (pixels por segundo)
  speedGrowthFactor: 6, // incremento de velocidade por comida coletada
  segmentSpacing: 10, // espaçamento alvo entre os segmentos do corpo
  initialLength: 14, // quantidade inicial de segmentos
  arenaPadding: 120, // margem interna para geração de comida
  foodSpawnInterval: 4, // intervalo (s) para forçar novo spawn caso não exista
  arenaColor: '#120a2c',
  gridSize: 24,
  particleTTL: 0.6,
  particleCount: 12,
  worldWidth: 2600,
  worldHeight: 2000,
  worldMinWidth: 2000,
  worldMinHeight: 1500,
  worldMaxWidth: 4400,
  worldMaxHeight: 3200,
  aiSnakeCount: 6,
  aiMaxCount: 16,
  aiDensity: 0.2, // quantidade de cobras IA por 100k px² da arena
  maxFoodItems: 28,
  foodMaxCount: 96,
  foodDensity: 0.75, // quantidade de comidas por 100k px² da arena
  aiColors: ['#8de0ff', '#ffd08d', '#9dffb0', '#ffb3f5', '#a3a3ff', '#ff9e9e'],
  aiAvoidanceRadius: 90,
  aiAvoidanceStrength: 240,
  aiWanderStrength: 0.6,
  aiRetargetDelay: 2.5,
};
