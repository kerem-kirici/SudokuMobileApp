import AsyncStorage from '@react-native-async-storage/async-storage';

export type Difficulty = 'Hard' | 'Medium' | 'Easy';

export interface GameStats {
  totalGamesPlayed: number;
  totalTimePlayed: number; // in seconds
  fastestTime: number; // in seconds
  slowestTime: number; // in seconds
  gamesCompleted: number;
  gamesAbandoned: number;
  gamesLost: number;
}

export interface DifficultyStats {
  hard: GameStats;
  medium: GameStats;
  easy: GameStats;
}

export interface GameRecord {
  id: string;
  completedAt: number; // timestamp
  timeSpent: number; // in seconds
  completed: boolean;
  lost: boolean;
  difficulty: Difficulty;
}

const STATS_KEY = 'sudoku_stats';
const GAME_RECORDS_KEY = 'sudoku_game_records';

export class StatisticsManager {
  // Get all statistics
  static async getStats(): Promise<DifficultyStats> {
    try {
      const statsJson = await AsyncStorage.getItem(STATS_KEY);
      if (statsJson) {
        const stats: DifficultyStats = JSON.parse(statsJson);
        // Fix corrupted fastestTime if it's 0 for each difficulty
        Object.keys(stats).forEach(difficulty => {
          if (stats[difficulty as keyof DifficultyStats].fastestTime === 0 || 
              stats[difficulty as keyof DifficultyStats].fastestTime === null) {
            stats[difficulty as keyof DifficultyStats].fastestTime = Infinity;
          }
        });
        await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
        return stats;
      }
      return this.getDefaultStats();
    } catch (error) {
      console.error('Error getting stats:', error);
      return this.getDefaultStats();
    }
  }

  // Get stats for a specific difficulty
  static async getStatsForDifficulty(difficulty: Difficulty): Promise<GameStats> {
    try {
      const allStats = await this.getStats();
      return allStats[difficulty.toLowerCase() as keyof DifficultyStats];
    } catch (error) {
      console.error(`Error getting stats for ${difficulty}:`, error);
      return this.getDefaultGameStats();
    }
  }

  // Get overall stats (combined from all difficulties)
  static async getOverallStats(): Promise<GameStats> {
    try {
      const difficultyStats = await this.getStats();
      const overall: GameStats = {
        totalGamesPlayed: 0,
        totalTimePlayed: 0,
        fastestTime: Infinity,
        slowestTime: 0,
        gamesCompleted: 0,
        gamesAbandoned: 0,
        gamesLost: 0,
      };

      // Combine stats from all difficulties
      Object.values(difficultyStats).forEach(stats => {
        overall.totalGamesPlayed += stats.totalGamesPlayed;
        overall.totalTimePlayed += stats.totalTimePlayed;
        overall.gamesCompleted += stats.gamesCompleted;
        overall.gamesAbandoned += stats.gamesAbandoned;
        overall.gamesLost += stats.gamesLost;
        
        if (stats.fastestTime !== Infinity) {
          overall.fastestTime = Math.min(overall.fastestTime, stats.fastestTime);
        }
        overall.slowestTime = Math.max(overall.slowestTime, stats.slowestTime);
      });

      return overall;
    } catch (error) {
      console.error('Error getting overall stats:', error);
      return this.getDefaultGameStats();
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

  // Get game records for a specific difficulty
  static async getGameRecordsForDifficulty(difficulty: Difficulty): Promise<GameRecord[]> {
    try {
      const allRecords = await this.getGameRecords();
      return allRecords.filter(record => record.difficulty === difficulty);
    } catch (error) {
      console.error(`Error getting game records for ${difficulty}:`, error);
      return [];
    }
  }

  // Record a completed game
  static async recordCompletedGame(timeSpent: number, difficulty: Difficulty): Promise<void> {
    try {
      // Add null check for difficulty
      if (!difficulty) {
        console.error('Difficulty is required for recording completed game');
        return;
      }

      // Get current stats
      const currentStats = await this.getStats();
      const currentRecords = await this.getGameRecords();
      console.log('currentStats', currentStats, 'timeSpent', timeSpent, 'difficulty', difficulty);

      // Create new game record
      const newRecord: GameRecord = {
        id: Date.now().toString(),
        completedAt: Date.now(),
        timeSpent,
        completed: true,
        lost: false,
        difficulty,
      };

      // Update stats for the specific difficulty
      const difficultyKey = difficulty.toLowerCase() as keyof DifficultyStats;
      const currentDifficultyStats = currentStats[difficultyKey];
      
      const updatedDifficultyStats: GameStats = {
        totalGamesPlayed: currentDifficultyStats.totalGamesPlayed + 1,
        totalTimePlayed: currentDifficultyStats.totalTimePlayed + timeSpent,
        fastestTime: currentDifficultyStats.fastestTime === Infinity ? timeSpent : Math.min(currentDifficultyStats.fastestTime, timeSpent),
        slowestTime: Math.max(currentDifficultyStats.slowestTime, timeSpent),
        gamesCompleted: currentDifficultyStats.gamesCompleted + 1,
        gamesAbandoned: currentDifficultyStats.gamesAbandoned,
        gamesLost: currentDifficultyStats.gamesLost,
      };

      // Update the difficulty-specific stats
      const updatedStats: DifficultyStats = {
        ...currentStats,
        [difficultyKey]: updatedDifficultyStats,
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
  static async recordLostGame(timeSpent: number, difficulty: Difficulty): Promise<void> {
    try {
      // Add null check for difficulty
      if (!difficulty) {
        console.error('Difficulty is required for recording lost game');
        return;
      }

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
        difficulty,
      };

      // Update stats for the specific difficulty
      const difficultyKey = difficulty.toLowerCase() as keyof DifficultyStats;
      const currentDifficultyStats = currentStats[difficultyKey];
      
      const updatedDifficultyStats: GameStats = {
        totalGamesPlayed: currentDifficultyStats.totalGamesPlayed + 1,
        totalTimePlayed: currentDifficultyStats.totalTimePlayed,
        fastestTime: currentDifficultyStats.fastestTime,
        slowestTime: currentDifficultyStats.slowestTime,
        gamesCompleted: currentDifficultyStats.gamesCompleted,
        gamesAbandoned: currentDifficultyStats.gamesAbandoned,
        gamesLost: currentDifficultyStats.gamesLost + 1,
      };

      // Update the difficulty-specific stats
      const updatedStats: DifficultyStats = {
        ...currentStats,
        [difficultyKey]: updatedDifficultyStats,
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
  static async recordAbandonedGame(difficulty: Difficulty): Promise<void> {
    try {
      // Add null check for difficulty
      if (!difficulty) {
        console.error('Difficulty is required for recording abandoned game');
        return;
      }

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
        difficulty,
      };

      // Update stats for the specific difficulty
      const difficultyKey = difficulty.toLowerCase() as keyof DifficultyStats;
      const currentDifficultyStats = currentStats[difficultyKey];
      
      const updatedDifficultyStats: GameStats = {
        ...currentDifficultyStats,
        totalGamesPlayed: currentDifficultyStats.totalGamesPlayed + 1,
        gamesAbandoned: currentDifficultyStats.gamesAbandoned + 1,
      };

      // Update the difficulty-specific stats
      const updatedStats: DifficultyStats = {
        ...currentStats,
        [difficultyKey]: updatedDifficultyStats,
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

  // Clear statistics for a specific difficulty
  static async clearStatsForDifficulty(difficulty: Difficulty): Promise<void> {
    try {
      const currentStats = await this.getStats();
      const currentRecords = await this.getGameRecords();
      
      // Reset stats for the specific difficulty
      const difficultyKey = difficulty.toLowerCase() as keyof DifficultyStats;
      currentStats[difficultyKey] = this.getDefaultGameStats();
      
      // Remove records for the specific difficulty
      const filteredRecords = currentRecords.filter(record => record.difficulty !== difficulty);
      
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(currentStats));
      await AsyncStorage.setItem(GAME_RECORDS_KEY, JSON.stringify(filteredRecords));
      
      console.log(`Statistics cleared for ${difficulty}`);
    } catch (error) {
      console.error(`Error clearing stats for ${difficulty}:`, error);
    }
  }

  // Get default stats
  private static getDefaultStats(): DifficultyStats {
    return {
      hard: this.getDefaultGameStats(),
      medium: this.getDefaultGameStats(),
      easy: this.getDefaultGameStats(),
    };
  }

  // Get default game stats
  private static getDefaultGameStats(): GameStats {
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

  // Get recent games for a specific difficulty (last 10)
  static async getRecentGamesForDifficulty(difficulty: Difficulty): Promise<GameRecord[]> {
    try {
      const records = await this.getGameRecordsForDifficulty(difficulty);
      return records
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 10);
    } catch (error) {
      console.error(`Error getting recent games for ${difficulty}:`, error);
      return [];
    }
  }
}
