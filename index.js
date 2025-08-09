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
    // Mobile: Use full viewport with constraints
    const maxWidth = Math.min(window.innerWidth, 480);
    const maxHeight = Math.min(window.innerHeight, 800);
    return {
      width: maxWidth,
      height: maxHeight,
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
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 900,
      height: 900
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
    }
  }
};

new Phaser.Game(config);
