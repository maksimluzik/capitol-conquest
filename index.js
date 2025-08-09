import { GameScene } from './src/GameScene.js';
import { MenuScene, HelpScene, ColorSelectScene } from './src/MenuScene.js';
import { GlobalStatsScene } from './src/GlobalStatsScene.js';

// Mobile detection and responsive sizing
// Note: We use custom detection here because this runs before Phaser initializes
// Once Phaser is loaded, scenes use Config.DEVICE which leverages Phaser's native device detection
function getGameDimensions() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   window.innerWidth <= 768;
  
  if (isMobile) {
    // Mobile: Use current viewport dimensions which will be dynamically adjusted
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: true
    };
  } else {
    // Desktop: Fixed size
    return {
      width: 900,
      height: 900,
      isMobile: false
    };
  }
}

const gameDimensions = getGameDimensions();

const config = {
  type: Phaser.AUTO,
  width: gameDimensions.width,
  height: gameDimensions.height,
  backgroundColor: '#f2f2f2',
  scene: [MenuScene, HelpScene, ColorSelectScene, GlobalStatsScene, GameScene],
  scale: {
    mode: gameDimensions.isMobile ? Phaser.Scale.RESIZE : Phaser.Scale.NONE,
    autoCenter: gameDimensions.isMobile ? Phaser.Scale.CENTER_BOTH : Phaser.Scale.NO_CENTER,
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  // Store device info globally
  device: {
    isMobile: gameDimensions.isMobile
  },
  callbacks: {
    postBoot: function(game) {
      // Log Phaser's native device detection for debugging
      console.log('Phaser Device Detection:');
      console.log('Desktop:', game.device.os.desktop);
      console.log('Mobile:', !game.device.os.desktop);
      console.log('iOS:', game.device.os.iOS);
      console.log('Android:', game.device.os.android);
      console.log('iPad:', game.device.os.iPad);
      console.log('iPhone:', game.device.os.iPhone);
      console.log('Touch Available:', game.device.input.touch);
      console.log('Canvas Available:', game.device.canvasFeatures);
      
      // Handle mobile viewport changes (address bar, orientation changes)
      if (gameDimensions.isMobile) {
        const resizeGame = () => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          game.scale.resize(width, height);
        };
        
        // Listen for various mobile viewport events
        window.addEventListener('resize', resizeGame);
        window.addEventListener('orientationchange', () => {
          // Delay to allow browser to finish orientation change
          setTimeout(resizeGame, 100);
        });
        
        // Handle mobile browser bar show/hide
        if (window.visualViewport) {
          window.visualViewport.addEventListener('resize', resizeGame);
        }
        
        // Initial resize to ensure proper fit
        setTimeout(resizeGame, 100);
      }
    }
  }
};

new Phaser.Game(config);
