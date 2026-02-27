const STORAGE_KEY = 'solana-survivors-leaderboard';

export interface LeaderboardEntry {
  player: string;
  score: number;
  level: number;
  kills: number;
  duration: number; // ms
  killerMint: string | null;
  killerName: string | null;
  timestamp: number;
}

/**
 * Simple localStorage-based leaderboard for hackathon MVP.
 * "Top Killers" data comes from on-chain EnemyAssetAccount kill_counters
 * and is provided externally via EnemyPoolService.
 */
export class LeaderboardService {
  /**
   * Append a new run result to the leaderboard.
   */
  addEntry(entry: LeaderboardEntry): void {
    const entries = this.getEntries();
    entries.push(entry);
    // Keep top 100 by score
    entries.sort((a, b) => b.score - a.score);
    if (entries.length > 100) entries.length = 100;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  /**
   * Get all stored entries sorted by score descending.
   */
  getEntries(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as LeaderboardEntry[];
    } catch {
      return [];
    }
  }

  /**
   * Get top N runs by score.
   */
  getTopRuns(limit: number): LeaderboardEntry[] {
    return this.getEntries().slice(0, limit);
  }
}
