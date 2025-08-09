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
      playerChoice      // 'red' | 'blue' (for single player mode)
    } = gameResult;

    try {
      // Use Apps Script proxy endpoint for recording data
      const response = await fetch(this.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winner,
          gameMode,
          redScore,
          blueScore,
          gameDuration: gameDuration || 0,
          playerChoice: playerChoice || 'N/A'
        })
      });

      if (!response.ok) {
        throw new Error(`Apps Script request failed: ${response.status}`);
      }

      const result = await response.json();
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
      const data = await this.readRange('A:G');
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
      recentGames: []
    };

    let totalDuration = 0;
    let singlePlayerChoiceStats = { red: { games: 0, wins: 0 }, blue: { games: 0, wins: 0 } };

    rows.forEach((row, index) => {
      const [date, winner, gameMode, redScore, blueScore, duration, playerChoice] = row;
      
      // Count wins
      if (winner === 'Republicans') stats.republicanWins++;
      else if (winner === 'Democrats') stats.democratWins++;
      else stats.draws++;

      // Count game modes
      if (gameMode === 'single') {
        stats.singlePlayerGames++;
        
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

      // Store recent games (last 10)
      if (index < 10) {
        stats.recentGames.push({
          date: new Date(date).toLocaleDateString(),
          winner,
          gameMode,
          scores: `${redScore}-${blueScore}`,
          duration: this.formatDuration(parseInt(duration) || 0)
        });
      }
    });

    // Calculate averages and rates
    stats.averageGameDuration = totalDuration / rows.length;
    stats.winRateByChoice.red = singlePlayerChoiceStats.red.games > 0 
      ? (singlePlayerChoiceStats.red.wins / singlePlayerChoiceStats.red.games * 100)
      : 0;
    stats.winRateByChoice.blue = singlePlayerChoiceStats.blue.games > 0 
      ? (singlePlayerChoiceStats.blue.wins / singlePlayerChoiceStats.blue.games * 100) 
      : 0;

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
