var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getActiveSheet();


function switchToNextTab() {
  var index = sheet.getIndex();
  var numSheets = SpreadsheetApp.getActiveSpreadsheet().getNumSheets();
  if (index < numSheets) {
    var nextSheet = ss.getSheets([index];
    SpreadsheetApp.setActiveSheet(nextSheet);
  }
})
