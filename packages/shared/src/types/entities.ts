export interface PlayerState {
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  level: number;
  xp: number;
  xpToNext: number;
  speed: number;
  pickupRadius: number;
  armor: number;
  gold: number;
  kills: number;
  invulnerable: boolean;
}

export type EnemyType = 'swarm' | 'fast' | 'tank' | 'ranged' | 'exploder' | 'elite' | 'boss';

export interface EnemyState {
  type: EnemyType;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  speed: number;
  damage: number;
  xpValue: number;
}

export interface SpawnRequest {
  enemyType: EnemyType;
  count: number;
}
