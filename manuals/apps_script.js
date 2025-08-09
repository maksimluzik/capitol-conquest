const SPREADSHEET_ID = '1RoWR5JqjiZSerZ6yXQ-h8MxnHFSkeiQRUK4dW8JmpQ4'; // Your actual sheet ID
const SHEET_NAME = 'GameStats';

/**
 * Handles preflight OPTIONS requests for CORS
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '3600');
}

/**
 * Handles HTTP GET requests and routes to the appropriate endpoint.
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ note: 'Use POST method' }))
      .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST endpoint to append a new game result to the sheet,
 * with CORS headers set on response.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.winner || !data.gameMode || data.redScore === undefined || data.blueScore === undefined) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Missing required fields' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*') // Add CORS header
        .setResponseCode(400);
    }

    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      data.winner,
      data.gameMode,
      data.redScore,
      data.blueScore,
      data.gameDuration || 0,
      data.playerChoice || 'N/A'
    ];

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow(row);

    Logger.log(`Successfully recorded game data: ${JSON.stringify(row)}`)
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*'); // Add CORS header

  } catch (err) {
    Logger.log(`Error recording game data: ${JSON.stringify(err.message)}`)
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*') // Add CORS header
      .setResponseCode(500);
  }
}
