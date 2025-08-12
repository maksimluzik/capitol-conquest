const SPREADSHEET_ID = '1RoWR5JqjiZSerZ6yXQ-h8MxnHFSkeiQRUK4dW8JmpQ4'; // Your actual sheet ID
const SHEET_NAME = 'GameStats';

/**
 * Handles HTTP GET requests and routes to the appropriate endpoint.
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ note: 'Use POST method' }))
      .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST endpoint to append a new game result to the sheet.
 * Handles form data to avoid CORS preflight issues.
 * Updated to include difficulty level tracking for AI games.
 */
function doPost(e) {
  try {
    // Extract form data from parameters
    const data = {
      winner: e.parameter.winner,
      gameMode: e.parameter.gameMode,
      redScore: parseInt(e.parameter.redScore),
      blueScore: parseInt(e.parameter.blueScore),
      gameDuration: parseInt(e.parameter.gameDuration) || 0,
      playerChoice: e.parameter.playerChoice || 'N/A',
      difficulty: e.parameter.difficulty || 'normal',
      aiPieceMultiplier: parseInt(e.parameter.aiPieceMultiplier) || 1
    };

    Logger.log(`Received form data: ${JSON.stringify(data)}`);

    // Validate required fields
    if (!data.winner || !data.gameMode || isNaN(data.redScore) || isNaN(data.blueScore)) {
      Logger.log('Missing or invalid required fields');
      return ContentService.createTextOutput(JSON.stringify({ error: 'Missing or invalid required fields' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setResponseCode(400);
    }

    // Prepare row data with new difficulty columns
    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      data.winner,
      data.gameMode,
      data.redScore,
      data.blueScore,
      data.gameDuration,
      data.playerChoice,
      data.difficulty,
      data.aiPieceMultiplier
    ];

    // Get or create sheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      const headers = [
        'Timestamp',
        'Winner',
        'Game Mode',
        'Red Score',
        'Blue Score',
        'Duration (seconds)',
        'Player Choice',
        'Difficulty',
        'AI Piece Multiplier'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Append to sheet
    sheet.appendRow(row);

    Logger.log(`Successfully recorded game data: ${JSON.stringify(row)}`);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, timestamp: timestamp }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log(`Error recording game data: ${err.message}`);
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setResponseCode(500);
  }
}

/**
 * Utility function to manually add headers if needed
 * Run this once if your sheet doesn't have proper headers
 */
function addHeaders() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  const headers = [
    'Timestamp',
    'Winner',
    'Game Mode',
    'Red Score',
    'Blue Score',
    'Duration (seconds)',
    'Player Choice',
    'Difficulty',
    'AI Piece Multiplier'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  Logger.log('Headers added successfully');
}
