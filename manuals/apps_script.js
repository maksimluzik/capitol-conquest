const SPREADSHEET_ID = '1RoWR5JqjiZSerZ6yXQ-h8MxnHFSkeiQRUK4dW8JmpQ4'; // Replace with your actual sheet ID
const SHEET_NAME = 'GameStats';

/**
 * POST endpoint to append a new game result to the sheet.
 * Expects JSON in request body with keys:
 *   winner, gameMode, redScore, blueScore, gameDuration, playerChoice
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.winner || !data.gameMode || data.redScore === undefined || data.blueScore === undefined) {
      return ContentService.createTextOutput(JSON.stringify({error: 'Missing required fields'}))
        .setMimeType(ContentService.MimeType.JSON);
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

    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

