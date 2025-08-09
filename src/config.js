// config.js - Global configuration for the game
export const Config = {
  // Font configuration
  FONT_FAMILY: 'Roboto',
  
  // Font sizes
  FONT_SIZES: {
    TITLE: '50px',
    LARGE: '46px', 
    MEDIUM: '30px',
    NORMAL: '24px',
    SMALL: '20px',
    TINY: '18px',
    MINI: '16px'
  },
  
  // Colors
  COLORS: {
    PRIMARY: '#0a3d91',
    TEXT_DARK: '#222',
    TEXT_LIGHT: '#fff',
    BACKGROUND: '#f0f0f0',
    
    // Text colors optimized for background readability
    TEXT_WHITE: '#ffffff',
    TEXT_GOLD: '#ffd700',
    TEXT_BRIGHT_GOLD: '#ffed4e',
    TEXT_SILVER: '#c0c0c0',
    TEXT_CYAN: '#00ffff',
    TEXT_LIGHT_BLUE: '#87ceeb',
    TEXT_ORANGE: '#ffa500',
    TEXT_GREEN: '#32cd32',
    TEXT_RED: '#ff6b6b',
    
    // UI element colors
    BUTTON_BACKGROUND: '#2c3e50',
    BUTTON_HOVER: '#34495e',
    OVERLAY_DARK: 0x000000,
    MODAL_BACKGROUND: '#2c3e50',
    
    // Game colors
    PLAYER_COLORS: ['#e74c3c', '#3498db', '#f39c12', '#2ecc71'],
    
    // Special accent colors for important text
    ACCENT_BRIGHT: '#ffff00',
    ACCENT_GLOW: '#ffffff'
  },
  
  // Assets
  ASSETS: {
    SPLASH_IMAGE: 'assets/capitol-conquest-splash_square.png',
    BACKGROUND_MUSIC: 'sounds/music.mp3',
    PIECE_MOVE_SOUND: 'sounds/piece-move.mp3',
    PIECE_JUMP_SOUND: 'sounds/piece-jump.mp3',
    CONVERT_SOUND: 'sounds/convert.mp3'
  },
  
  // API Configuration
  API: {
    GOOGLE_SHEETS_API_KEY: 'AIzaSyDJEnSYiNtr9FJZEPV1h7Fd6dioubP5GuY',
    SPREADSHEET_ID: '1RoWR5JqjiZSerZ6yXQ-h8MxnHFSkeiQRUK4dW8JmpQ4',
    SHEET_NAME: 'GameStats',
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxicZTTphEMFckFqG6JPBjgF1KHa8zWRTqEMtq2DwUz9ftqru9UqTWfSBZGMRB_FjGX/exec'
  },
  
  // Game Difficulty Configuration
  DIFFICULTY: {
    DEFAULT: {
      difficulty: 'normal',
      aiPieceMultiplier: 1
    },
    LEVELS: {
      NORMAL: { difficulty: 'normal', aiPieceMultiplier: 1 },
      HARD: { difficulty: 'hard', aiPieceMultiplier: 2 },
      EXPERT: { difficulty: 'expert', aiPieceMultiplier: 3 }
    }
  },
  
  // Device Detection and Responsive Settings
  DEVICE: {
    isMobile: function(scene) {
      // Use Phaser's native device detection
      if (scene && scene.sys && scene.sys.game && scene.sys.game.device) {
        return !scene.sys.game.device.os.desktop;
      }
      // Fallback for cases where scene/device isn't available yet
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             window.innerWidth <= 768;
    },
    isTablet: function(scene) {
      if (scene && scene.sys && scene.sys.game && scene.sys.game.device) {
        return scene.sys.game.device.os.iPad || 
               (scene.sys.game.device.os.android && Math.min(window.innerWidth, window.innerHeight) >= 600);
      }
      return /iPad/i.test(navigator.userAgent);
    },
    isPortrait: function() {
      return window.innerHeight > window.innerWidth;
    },
    getResponsiveScale: function(baseSize, scene) {
      const isMobile = this.isMobile(scene);
      if (!isMobile) return 1;
      
      // Mobile scaling based on screen size
      const screenWidth = scene.scale.width;
      const screenHeight = scene.scale.height;
      const minDimension = Math.min(screenWidth, screenHeight);
      
      // Scale factor for mobile (smaller boards)
      return Math.min(1, minDimension / 600);
    },
    getMobileLayout: function(scene) {
      const isMobile = this.isMobile(scene);
      const isTablet = this.isTablet(scene);
      
      return {
        isMobile: isMobile,
        isTablet: isTablet,
        isDesktop: !isMobile,
        screenWidth: scene.scale.width,
        screenHeight: scene.scale.height,
        scale: this.getResponsiveScale(1, scene),
        // Mobile-specific spacing
        buttonSpacing: isMobile ? 40 : 60,
        fontSize: isMobile ? 'small' : 'medium',
        padding: isMobile ? 8 : 16
      };
    }
  },
  
  // Helper function to create text style objects
  textStyle: (fontSize, color = '#222', options = {}) => ({
    fontFamily: Config.FONT_FAMILY,
    fontSize: fontSize,
    color: color,
    ...options
  })
};
