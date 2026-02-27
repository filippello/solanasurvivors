export interface GameState {
  elapsedMs: number;
  paused: boolean;
  gameOver: boolean;
  victory: boolean;
}

export interface RunResult {
  victory: boolean;
  timeSurvivedMs: number;
  level: number;
  kills: number;
  gold: number;
  killerMint?: string | null;
  killerName?: string | null;
  killerCollection?: string | null;
}
