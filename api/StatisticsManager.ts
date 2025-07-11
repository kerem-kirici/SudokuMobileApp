import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GameStats {
  totalGamesPlayed: number;
  totalTimePlayed: number; // in seconds
  fastestTime: number; // in seconds
  slowestTime: number; // in seconds
  gamesCompleted: number;
  gamesAbandoned: number;
  gamesLost: number;
}

export interface GameRecord {
  id: string;
  completedAt: number; // timestamp
  timeSpent: number; // in seconds
  completed: boolean;
  lost: boolean;
}

const STATS_KEY = 'sudoku_stats';
const GAME_RECORDS_KEY = 'sudoku_game_records';

export class StatisticsManager {
  // Get all statistics
  static async getStats(): Promise<GameStats> {
    try {
      const statsJson = await AsyncStorage.getItem(STATS_KEY);
      if (statsJson) {
        const stats = JSON.parse(statsJson);
        // Fix corrupted fastestTime if it's 0
        if (stats.fastestTime === 0 || stats.fastestTime === null) {
          stats.fastestTime = Infinity;
          await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
        }
        return stats;
      }
      return this.getDefaultStats();
    } catch (error) {
      console.error('Error getting stats:', error);
      return this.getDefaultStats();
    }
  }

  // Get game records
  static async getGameRecords(): Promise<GameRecord[]> {
    try {
      const recordsJson = await AsyncStorage.getItem(GAME_RECORDS_KEY);
      if (recordsJson) {
        return JSON.parse(recordsJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting game records:', error);
      return [];
    }
  }

  // Record a completed game
  static async recordCompletedGame(timeSpent: number): Promise<void> {
    try {
      // Get current stats
      const currentStats = await this.getStats();
      const currentRecords = await this.getGameRecords();
      console.log('currentStats', currentStats, 'timeSpent', timeSpent);

      // Create new game record
      const newRecord: GameRecord = {
        id: Date.now().toString(),
        completedAt: Date.now(),
        timeSpent,
        completed: true,
        lost: false,
      };

      // Update stats
      const updatedStats: GameStats = {
        totalGamesPlayed: currentStats.totalGamesPlayed + 1,
        totalTimePlayed: currentStats.totalTimePlayed + timeSpent,
        fastestTime: currentStats.fastestTime === Infinity ? timeSpent : Math.min(currentStats.fastestTime, timeSpent),
        slowestTime: Math.max(currentStats.slowestTime, timeSpent),
        gamesCompleted: currentStats.gamesCompleted + 1,
        gamesAbandoned: currentStats.gamesAbandoned,
        gamesLost: currentStats.gamesLost,
      };

      // Save updated stats and records
      console.log('updatedStats', updatedStats);
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      await AsyncStorage.setItem(GAME_RECORDS_KEY, JSON.stringify([...currentRecords, newRecord]));

      console.log('Game completed and recorded:', newRecord);
    } catch (error) {
      console.error('Error recording completed game:', error);
    }
  }

  // Record a lost game (3 mistakes)
  static async recordLostGame(timeSpent: number): Promise<void> {
    try {
      // Get current stats
      const currentStats = await this.getStats();
      const currentRecords = await this.getGameRecords();

      // Create new game record
      const newRecord: GameRecord = {
        id: Date.now().toString(),
        completedAt: Date.now(),
        timeSpent,
        completed: false,
        lost: true,
      };

      // Update stats
      const updatedStats: GameStats = {
        totalGamesPlayed: currentStats.totalGamesPlayed + 1,
        totalTimePlayed: currentStats.totalTimePlayed,
        fastestTime: currentStats.fastestTime,
        slowestTime: currentStats.slowestTime,
        gamesCompleted: currentStats.gamesCompleted,
        gamesAbandoned: currentStats.gamesAbandoned,
        gamesLost: currentStats.gamesLost + 1,
      };

      // Save updated stats and records
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      await AsyncStorage.setItem(GAME_RECORDS_KEY, JSON.stringify([...currentRecords, newRecord]));

      console.log('Game lost and recorded:', newRecord);
    } catch (error) {
      console.error('Error recording lost game:', error);
    }
  }

  // Record an abandoned game
  static async recordAbandonedGame(): Promise<void> {
    try {
      // Get current stats
      const currentStats = await this.getStats();
      const currentRecords = await this.getGameRecords();

      // Create new game record
      const newRecord: GameRecord = {
        id: Date.now().toString(),
        completedAt: Date.now(),
        timeSpent: Infinity,
        completed: false,
        lost: false,
      };

      // Update stats
      const updatedStats: GameStats = {
        ...currentStats,
        totalGamesPlayed: currentStats.totalGamesPlayed + 1,
        gamesAbandoned: currentStats.gamesAbandoned + 1,
      };

      // Save updated stats and records
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      await AsyncStorage.setItem(GAME_RECORDS_KEY, JSON.stringify([...currentRecords, newRecord]));

      console.log('Game abandoned and recorded:', newRecord);
    } catch (error) {
      console.error('Error recording abandoned game:', error);
    }
  }

  // Clear all statistics
  static async clearStats(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STATS_KEY);
      await AsyncStorage.removeItem(GAME_RECORDS_KEY);
      console.log('Statistics cleared');
    } catch (error) {
      console.error('Error clearing stats:', error);
    }
  }

  // Get default stats
  private static getDefaultStats(): GameStats {
    return {
      totalGamesPlayed: 0,
      totalTimePlayed: 0,
      fastestTime: Infinity, 
      slowestTime: 0,
      gamesCompleted: 0,
      gamesAbandoned: 0,
      gamesLost: 0,
    };
  }

  // Format time for display
  static formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Get recent games (last 10)
  static async getRecentGames(): Promise<GameRecord[]> {
    try {
      const records = await this.getGameRecords();
      return records
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting recent games:', error);
      return [];
    }
  }
}
