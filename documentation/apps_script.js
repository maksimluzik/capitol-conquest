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
      playerChoice: e.parameter.playerChoice || 'N/A'
    };

    Logger.log(`Received form data: ${JSON.stringify(data)}`);

    // Validate required fields
    if (!data.winner || !data.gameMode || isNaN(data.redScore) || isNaN(data.blueScore)) {
      Logger.log('Missing or invalid required fields');
      return ContentService.createTextOutput(JSON.stringify({ error: 'Missing or invalid required fields' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setResponseCode(400);
    }

    // Prepare row data
    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      data.winner,
      data.gameMode,
      data.redScore,
      data.blueScore,
      data.gameDuration,
      data.playerChoice
    ];

    // Append to sheet
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow(row);

    Logger.log(`Successfully recorded game data: ${JSON.stringify(row)}`);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, timestamp: timestamp }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');

  } catch (err) {
    Logger.log(`Error recording game data: ${err.message}`);
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setResponseCode(500);
  }
}
