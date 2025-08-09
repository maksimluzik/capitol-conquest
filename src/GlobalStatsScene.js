// GlobalStatsScene.js - Display global statistics from Google Sheets
import { GlobalStats } from './GlobalStats.js';
import { Config } from './config.js';

export class GlobalStatsScene extends Phaser.Scene {
  constructor() { 
    super('GlobalStatsScene'); 
    this.globalStats = new GlobalStats();
  }

  preload() {
    this.load.image('splash', Config.ASSETS.SPLASH_IMAGE);
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Add background image
    const bg = this.add.image(w/2, h/2, 'splash');
    const scaleX = w / bg.width;
    const scaleY = h / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Add semi-transparent overlay
    this.add.rectangle(w/2, h/2, w, h, Config.COLORS.OVERLAY_DARK, 0.7);

    // Title
    this.add.text(w/2, 40, '🏆 Global Statistics', 
      Config.textStyle(Config.FONT_SIZES.LARGE, Config.COLORS.TEXT_BRIGHT_GOLD)
    ).setOrigin(0.5);

    // Loading indicator
    this.loadingText = this.add.text(w/2, h/2, 'Loading global statistics...', 
      Config.textStyle(Config.FONT_SIZES.SMALL, Config.COLORS.TEXT_WHITE)
    ).setOrigin(0.5);

    // Load and display stats
    this.loadGlobalStats();

    // Back button
    const backBtn = this.add.text(40, 40, '← Back', 
      Config.textStyle(Config.FONT_SIZES.SMALL, Config.COLORS.TEXT_CYAN)
    ).setInteractive({ useHandCursor: true });
    
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    backBtn.on('pointerover', () => backBtn.setStyle({ color: Config.COLORS.TEXT_BRIGHT_GOLD }));
    backBtn.on('pointerout', () => backBtn.setStyle({ color: Config.COLORS.TEXT_CYAN }));
    
    // Add music toggle
    this.addMusicToggle(w);
  }

  async loadGlobalStats() {
    try {
      // Initialize the Google Sheets API first
      const initialized = await this.globalStats.initialize();
      if (!initialized) {
        this.showError('Failed to initialize Google Sheets API');
        return;
      }

      const stats = await this.globalStats.getGlobalStatistics();
      this.displayStats(stats);
    } catch (error) {
      this.showError('Failed to load global statistics');
    }
  }

  displayStats(stats) {
    // Clear loading text
    if (this.loadingText) {
      this.loadingText.destroy();
      this.loadingText = null;
    }

    const w = this.scale.width;
    const startY = 120;
    const lineHeight = 30;
    let currentY = startY;

    // Overall Statistics
    this.add.text(w/2, currentY, 'Overall Statistics', 
      Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_GOLD)
    ).setOrigin(0.5);
    currentY += lineHeight * 1.5;

    const overallStats = [
      `Total Games Played: ${stats.totalGames.toLocaleString()}`,
      `Republican Wins: ${stats.republicanWins.toLocaleString()} (${this.getPercentage(stats.republicanWins, stats.totalGames)}%)`,
      `Democrat Wins: ${stats.democratWins.toLocaleString()} (${this.getPercentage(stats.democratWins, stats.totalGames)}%)`,
      `Draws: ${stats.draws.toLocaleString()} (${this.getPercentage(stats.draws, stats.totalGames)}%)`,
      `Single Player Games: ${stats.singlePlayerGames.toLocaleString()}`,
      `Two Player Games: ${stats.twoPlayerGames.toLocaleString()}`,
      `Average Game Duration: ${this.globalStats.formatDuration(Math.round(stats.averageGameDuration))}`
    ];

    overallStats.forEach(stat => {
      this.add.text(60, currentY, stat, 
        Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_WHITE)
      );
      currentY += lineHeight;
    });

    currentY += lineHeight;

    // Single Player Performance
    if (stats.singlePlayerGames > 0) {
      this.add.text(w/2, currentY, 'Single Player Performance', 
        Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_GOLD)
      ).setOrigin(0.5);
      currentY += lineHeight * 1.5;

      const singlePlayerStats = [
        `Playing as Republicans - Win Rate: ${stats.winRateByChoice.red.toFixed(1)}%`,
        `Playing as Democrats - Win Rate: ${stats.winRateByChoice.blue.toFixed(1)}%`
      ];

      singlePlayerStats.forEach(stat => {
        this.add.text(60, currentY, stat, 
          Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_WHITE)
        );
        currentY += lineHeight;
      });

      currentY += lineHeight;

      // Difficulty Statistics
      this.add.text(w/2, currentY, 'Difficulty Statistics', 
        Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_GOLD)
      ).setOrigin(0.5);
      currentY += lineHeight * 1.5;

      Object.entries(stats.difficultyStats).forEach(([difficulty, diffStats]) => {
        const difficultyName = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        const winRateText = diffStats.games > 0 
          ? `${diffStats.winRate.toFixed(1)}% (${diffStats.wins}/${diffStats.games})`
          : 'No games played';
        
        this.add.text(60, currentY, `${difficultyName}: ${winRateText}`, 
          Config.textStyle(Config.FONT_SIZES.TINY, Config.COLORS.TEXT_WHITE)
        );
        currentY += lineHeight;
      });

      currentY += lineHeight;
    }

    // Recent Games
    if (stats.recentGames.length > 0) {
      this.add.text(w/2, currentY, 'Recent Games', 
        Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_GOLD)
      ).setOrigin(0.5);
      currentY += lineHeight * 1.5;

      // Header for recent games
      this.add.text(60, currentY, 'Date', 
        Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_BRIGHT_GOLD, { fontWeight: 'bold' })
      );
      this.add.text(150, currentY, 'Winner', 
        Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_BRIGHT_GOLD, { fontWeight: 'bold' })
      );
      this.add.text(250, currentY, 'Score', 
        Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_BRIGHT_GOLD, { fontWeight: 'bold' })
      );
      this.add.text(320, currentY, 'Mode', 
        Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_BRIGHT_GOLD, { fontWeight: 'bold' })
      );
      this.add.text(400, currentY, 'Duration', 
        Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_BRIGHT_GOLD, { fontWeight: 'bold' })
      );
      currentY += lineHeight;

      // Recent games list (limit to visible area)
      const maxGames = Math.min(stats.recentGames.length, 6);
      stats.recentGames.slice(0, maxGames).forEach(game => {
        this.add.text(60, currentY, game.date, 
          Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_WHITE)
        );
        
        const winnerColor = game.winner === 'Republicans' ? Config.COLORS.TEXT_RED : 
                           game.winner === 'Democrats' ? Config.COLORS.TEXT_LIGHT_BLUE : Config.COLORS.TEXT_WHITE;
        this.add.text(150, currentY, game.winner, 
          Config.textStyle(Config.FONT_SIZES.MINI, winnerColor)
        );
        
        this.add.text(250, currentY, game.scores, 
          Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_WHITE)
        );
        
        // Show mode with difficulty for single player
        let modeText = game.gameMode === 'single' ? 'AI' : '2P';
        if (game.gameMode === 'single' && game.difficulty) {
          const diffShort = game.difficulty === Config.DIFFICULTY.DEFAULT.difficulty ? 'N' : 
                           game.difficulty === 'hard' ? 'H' : 'E';
          modeText += `-${diffShort}`;
        }
        this.add.text(320, currentY, modeText, 
          Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_WHITE)
        );
        
        this.add.text(400, currentY, game.duration, 
          Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_WHITE)
        );
        
        currentY += lineHeight * 0.8;
      });
    }

    // Connection status
    this.add.text(w - 20, h - 20, 'Data from Google Sheets', 
      Config.textStyle('12px', Config.COLORS.TEXT_SILVER)
    ).setOrigin(1, 1);
  }

  showError(message) {
    if (this.loadingText) {
      this.loadingText.setText(message);
      this.loadingText.setStyle({ color: Config.COLORS.TEXT_RED });
    }

    // Show cached data message if available at bottom of screen
    const cached = localStorage.getItem('globalStatsCache');
    if (cached) {
      const cacheTimestamp = localStorage.getItem('globalStatsCacheTimestamp');
      let lastUpdated = 'offline';
      
      if (cacheTimestamp) {
        const date = new Date(parseInt(cacheTimestamp));
        lastUpdated = date.toLocaleString();
      }
      
      this.add.text(this.scale.width/2, this.scale.height - 40, 
        `Showing cached data (last updated: ${lastUpdated})`, 
        Config.textStyle(Config.FONT_SIZES.MINI, Config.COLORS.TEXT_SILVER)
      ).setOrigin(0.5);
    }
  }

  getPercentage(value, total) {
    return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  }

  addMusicToggle(w) {
    if (!this.game.music) return;
    
    const musicIcon = this.game.music.isPlaying ? '🎵' : '🔇';
    
    this.musicToggle = this.add.text(w - 20, 20, musicIcon, 
      Config.textStyle(Config.FONT_SIZES.MEDIUM, Config.COLORS.TEXT_WHITE)
    ).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(200);
    
    this.musicToggle.on('pointerdown', () => this.toggleMusic());
    this.musicToggle.on('pointerover', () => this.musicToggle.setScale(1.2));
    this.musicToggle.on('pointerout', () => this.musicToggle.setScale(1.0));
  }
  
  toggleMusic() {
    if (!this.game.music?.background) return;
    
    this.game.music.isPlaying = !this.game.music.isPlaying;
    
    if (this.game.music.isPlaying) {
      this.game.music.background.play();
      this.musicToggle.setText('🎵');
    } else {
      this.game.music.background.pause();
      this.musicToggle.setText('🔇');
    }
    
    localStorage.setItem('musicEnabled', this.game.music.isPlaying.toString());
  }
}
