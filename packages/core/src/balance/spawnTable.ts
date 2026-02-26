import { EnemyType } from '@solanasurvivors/shared';

export interface SpawnBracket {
  /** Minute at which this bracket starts (0-indexed) */
  startMinute: number;
  /** Enemy types available in this bracket */
  types: EnemyType[];
  /** Base spawns per second for this bracket */
  baseRate: number;
}

export const SPAWN_TABLE: SpawnBracket[] = [
  { startMinute: 0, types: ['swarm'], baseRate: 0.8 },
  { startMinute: 1, types: ['swarm', 'fast'], baseRate: 1.0 },
  { startMinute: 2, types: ['swarm', 'fast'], baseRate: 1.2 },
  { startMinute: 3, types: ['swarm', 'fast', 'tank'], baseRate: 1.5 },
  { startMinute: 4, types: ['swarm', 'fast', 'tank', 'ranged'], baseRate: 1.8 },
  { startMinute: 5, types: ['swarm', 'fast', 'tank', 'ranged', 'exploder'], baseRate: 2.0 },
  { startMinute: 6, types: ['swarm', 'fast', 'tank', 'ranged', 'exploder'], baseRate: 2.3 },
  { startMinute: 7, types: ['swarm', 'fast', 'tank', 'ranged', 'exploder', 'elite'], baseRate: 2.5 },
  { startMinute: 8, types: ['swarm', 'fast', 'tank', 'ranged', 'exploder', 'elite'], baseRate: 2.8 },
  { startMinute: 9, types: ['swarm', 'fast', 'tank', 'ranged', 'exploder', 'elite'], baseRate: 3.0 },
];
