# Google Sheets Integration Setup

## Overview
Capitol Conquest now tracks global game statistics using Google Sheets. This allows for worldwide leaderboards and statistics across all players.

## Setup Instructions

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. API Key Creation
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to Google Sheets API only for security

### 3. Spreadsheet Setup
1. Open the spreadsheet: `https://docs.google.com/spreadsheets/d/1RoWR5JqjiZSerZ6yXQ-h8MxnHFSkeiQRUK4dW8JmpQ4`
2. Make sure it's publicly readable or shared with your application
3. The spreadsheet should have these columns:
   - A: Date
   - B: Winner
   - C: GameMode  
   - D: RedScore
   - E: BlueScore
   - F: GameDuration
   - G: PlayerChoice

### 4. Code Configuration
Replace the API_KEY placeholder in `src/GlobalStats.js`:

```javascript
this.API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

### 5. Testing
1. Start the game
2. Play a complete game
3. Check the Google Sheet to verify data is being recorded
4. Access "Global Statistics" from the main menu

## Data Schema

### Recorded Data
- **Date**: ISO timestamp of game completion
- **Winner**: "Republicans", "Democrats", or "Draw"
- **GameMode**: "single" (vs AI) or "two" (local multiplayer)
- **RedScore**: Final score for red player
- **BlueScore**: Final score for blue player  
- **GameDuration**: Game length in seconds
- **PlayerChoice**: "red", "blue", or "N/A" (for single player mode)

### Statistics Calculated
- Total games played
- Win/loss ratios by party
- Single vs multiplayer game distribution
- Average game duration
- Win rates by player choice in single player
- Recent games history

## Privacy & Data
- Only game results are stored (no personal information)
- Data is aggregated for statistical analysis
- Individual games cannot be traced to specific users
- All data is public via Google Sheets

## Troubleshooting

### Common Issues
1. **"Failed to load global statistics"**
   - Check API key is correct
   - Verify Google Sheets API is enabled
   - Ensure spreadsheet is publicly accessible

2. **"Failed to record game result"**
   - Check internet connection
   - Verify API key permissions
   - Check browser console for detailed errors

3. **Empty statistics display**
   - Ensure spreadsheet has correct column headers
   - Check if any games have been recorded
   - Verify spreadsheet ID is correct

### Fallback Behavior
- If online connection fails, the game continues normally
- Local statistics still work via localStorage
- Cached global stats are shown when available
- Missing global stats don't affect gameplay

## Development Notes
- The `GlobalStats` class handles all Google Sheets communication
- Statistics are recorded asynchronously after game completion
- Local caching provides offline resilience
- The system gracefully degrades if the API is unavailable
