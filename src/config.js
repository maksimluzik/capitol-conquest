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
    BACKGROUND: '#f0f0f0'
  },
  
  // Helper function to create text style objects
  textStyle: (fontSize, color = '#222', options = {}) => ({
    fontFamily: Config.FONT_FAMILY,
    fontSize: fontSize,
    color: color,
    ...options
  })
};
