// GlobalStats.js - Google Sheets integration for global game statistics using gapi
import { Config } from './config.js';

export class GlobalStats {
  constructor() {
    this.SPREADSHEET_ID = Config.API.SPREADSHEET_ID;
    this.API_KEY = Config.API.GOOGLE_SHEETS_API_KEY;
    this.SHEET_NAME = Config.API.SHEET_NAME;
    this.APPS_SCRIPT_URL = Config.API.APPS_SCRIPT_URL;
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize the Google Sheets API using gapi
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Check if gapi is available
      if (typeof gapi === 'undefined') {
        console.warn('Google API client library not loaded');
        resolve(false);
        return;
      }

      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: this.API_KEY,
          });

          // Load the Google Sheets API
          await gapi.client.load('sheets', 'v4');

          this.isInitialized = true;
          console.log('Google Sheets API initialized successfully');
          resolve(true);
        } catch (error) {
          console.warn('Failed to initialize Google Sheets API:', error);
          resolve(false);
        }
      });
    });

    return this.initPromise;
  }

  /**
   * Record a game result to the global spreadsheet using Apps Script proxy
   * @param {Object} gameResult - Game outcome data
   */
  async recordGameResult(gameResult) {
    const {
      winner,           // 'Republicans' | 'Democrats' | 'Draw'
      gameMode,         // 'single' | 'two'
      redScore,         // Final red player score
      blueScore,        // Final blue player score
      gameDuration,     // Game duration in seconds
      playerChoice,     // 'red' | 'blue' (for single player mode)
      difficulty,       // 'normal' | 'hard' | 'expert' (for single player mode)
      aiPieceMultiplier // 1 | 2 | 3 (AI starting piece multiplier)
    } = gameResult;

    try {
      // Use FormData to avoid CORS preflight (no OPTIONS request)
      const formData = new FormData();
      formData.append('winner', winner);
      formData.append('gameMode', gameMode);
      formData.append('redScore', redScore.toString());
      formData.append('blueScore', blueScore.toString());
      formData.append('gameDuration', (gameDuration || 0).toString());
      formData.append('playerChoice', playerChoice || 'N/A');
      formData.append('difficulty', difficulty || Config.DIFFICULTY.DEFAULT.difficulty);
      formData.append('aiPieceMultiplier', (aiPieceMultiplier || 1).toString());

      console.log('Sending form data to Apps Script:', gameResult);

      const response = await fetch(this.APPS_SCRIPT_URL, {
        method: 'POST',
        // No Content-Type header - let browser set it automatically for FormData
        body: formData
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Apps Script error response:', errorText);
        throw new Error(`Apps Script request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Apps Script response:', result);
      
      if (result.error) {
        throw new Error(`Apps Script error: ${result.error}`);
      }

      console.log('Game result recorded to global stats via Apps Script:', gameResult);
      
      // Update local cache for quick access
      this.updateLocalCache(gameResult);
      
      return true;
    } catch (error) {
      console.error('Failed to record game result via Apps Script:', error);
      return false;
    }
  }

  /**
   * Retrieve global statistics summary
   */
  async getGlobalStatistics() {
    // Initialize if not already done
    const initialized = await this.initialize();
    if (!initialized) {
      console.warn('Cannot get global stats - API not initialized, using cached data');
      return this.getCachedStats();
    }

    try {
      const data = await this.readRange('A:I'); // Extended to include difficulty columns
      console.log('Fetched global stats data:', data);
      if (!data || !data.values || data.values.length <= 1) {
        return this.getEmptyStats();
      }

      const rows = data.values.slice(1); // Skip header row
      const stats = this.calculateStatistics(rows);
      
      // Cache results locally with timestamp
      localStorage.setItem('globalStatsCache', JSON.stringify(stats));
      localStorage.setItem('globalStatsCacheTimestamp', Date.now().toString());

      return stats;
    } catch (error) {
      console.warn('Failed to fetch global stats, using cached data:', error);
      return this.getCachedStats();
    }
  }

  /**
   * Calculate statistics from raw spreadsheet data
   */
  calculateStatistics(rows) {
    const stats = {
      totalGames: rows.length,
      republicanWins: 0,
      democratWins: 0,
      draws: 0,
      singlePlayerGames: 0,
      twoPlayerGames: 0,
      averageGameDuration: 0,
      totalScore: { red: 0, blue: 0 },
      winRateByChoice: { red: 0, blue: 0 }, // For single player
      difficultyStats: { // New difficulty tracking
        normal: { games: 0, wins: 0 },
        hard: { games: 0, wins: 0 },
        expert: { games: 0, wins: 0 }
      },
      recentGames: []
    };

    let totalDuration = 0;
    let singlePlayerChoiceStats = { red: { games: 0, wins: 0 }, blue: { games: 0, wins: 0 } };

    rows.forEach((row, index) => {
      // Updated to handle new columns: [date, winner, gameMode, redScore, blueScore, duration, playerChoice, difficulty, aiPieceMultiplier]
      const [date, winner, gameMode, redScore, blueScore, duration, playerChoice, difficulty, aiPieceMultiplier] = row;
      
      // Count wins
      if (winner === 'Republicans') stats.republicanWins++;
      else if (winner === 'Democrats') stats.democratWins++;
      else stats.draws++;

      // Count game modes
      if (gameMode === 'single') {
        stats.singlePlayerGames++;
        
        // Track difficulty stats for single player games
        const gameDifficulty = difficulty || Config.DIFFICULTY.DEFAULT.difficulty;
        if (stats.difficultyStats[gameDifficulty]) {
          stats.difficultyStats[gameDifficulty].games++;
          if (winner && winner !== 'Draw') {
            // Determine if human won (check if winner matches playerChoice)
            if ((playerChoice === 'red' && winner === 'Republicans') ||
                (playerChoice === 'blue' && winner === 'Democrats')) {
              stats.difficultyStats[gameDifficulty].wins++;
            }
          }
        }
        
        // Track single player choice performance
        if (playerChoice === 'red' || playerChoice === 'blue') {
          singlePlayerChoiceStats[playerChoice].games++;
          if ((playerChoice === 'red' && winner === 'Republicans') ||
              (playerChoice === 'blue' && winner === 'Democrats')) {
            singlePlayerChoiceStats[playerChoice].wins++;
          }
        }
      } else {
        stats.twoPlayerGames++;
      }

      // Accumulate scores and duration
      stats.totalScore.red += parseInt(redScore) || 0;
      stats.totalScore.blue += parseInt(blueScore) || 0;
      totalDuration += parseInt(duration) || 0;

      // Store all games for recent games processing (include difficulty info)
      const gameEntry = {
        date: new Date(date).toLocaleDateString(),
        winner,
        gameMode,
        scores: `${redScore}-${blueScore}`,
        duration: this.formatDuration(parseInt(duration) || 0)
      };
      
      // Add difficulty info for single player games
      if (gameMode === 'single') {
        gameEntry.difficulty = difficulty || Config.DIFFICULTY.DEFAULT.difficulty;
        gameEntry.playerChoice = playerChoice;
      }
      
      stats.recentGames.push(gameEntry);
    });

    // Reverse to show latest games first and limit to 10
    stats.recentGames = stats.recentGames.reverse().slice(0, 10);

    // Calculate averages and rates
    stats.averageGameDuration = totalDuration / rows.length;
    stats.winRateByChoice.red = singlePlayerChoiceStats.red.games > 0 
      ? (singlePlayerChoiceStats.red.wins / singlePlayerChoiceStats.red.games * 100)
      : 0;
    stats.winRateByChoice.blue = singlePlayerChoiceStats.blue.games > 0 
      ? (singlePlayerChoiceStats.blue.wins / singlePlayerChoiceStats.blue.games * 100) 
      : 0;

    // Calculate difficulty win rates
    Object.keys(stats.difficultyStats).forEach(difficulty => {
      const diffStats = stats.difficultyStats[difficulty];
      diffStats.winRate = diffStats.games > 0 ? (diffStats.wins / diffStats.games * 100) : 0;
    });

    return stats;
  }

  /**
   * Read data from a specific range in the spreadsheet using gapi
   */
  async readRange(range) {
    if (!this.isInitialized) {
      throw new Error('Google Sheets API not initialized');
    }

    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: `${this.SHEET_NAME}!${range}`
      });
      
      return response.result;
    } catch (error) {
      console.error('Error reading from sheet:', error);
      throw error;
    }
  }

  /**
   * Update local cache for offline access
   */
  updateLocalCache(gameResult) {
    const cached = localStorage.getItem('globalStatsCache');
    if (cached) {
      const data = JSON.parse(cached);
      // Update cached stats with new game result
      data.lastGame = gameResult;
      localStorage.setItem('globalStatsCache', JSON.stringify(data));
    }
  }

  /**
   * Get cached statistics when online fetch fails
   */
  getCachedStats() {
    const cached = localStorage.getItem('globalStatsCache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {
        console.warn('Failed to parse cached stats:', error);
        return this.getEmptyStats();
      }
    }
    return this.getEmptyStats();
  }

  /**
   * Return empty statistics structure
   */
  getEmptyStats() {
    return {
      totalGames: 0,
      republicanWins: 0,
      democratWins: 0,
      draws: 0,
      singlePlayerGames: 0,
      twoPlayerGames: 0,
      averageGameDuration: 0,
      totalScore: { red: 0, blue: 0 },
      winRateByChoice: { red: 0, blue: 0 },
      difficultyStats: {
        normal: { games: 0, wins: 0, winRate: 0 },
        hard: { games: 0, wins: 0, winRate: 0 },
        expert: { games: 0, wins: 0, winRate: 0 }
      },
      recentGames: []
    };
  }

  /**
   * Format duration in seconds to readable string
   */
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  }

  /**
   * Test the connection to Google Sheets using gapi
   */
  async testConnection() {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }

      await this.readRange('A1:A1');
      return true;
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }
}
