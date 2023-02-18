var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getActiveSheet();
var selectedCell = ss.getActiveCell();

var numSheets = SpreadsheetApp.getActiveSpreadsheet().getNumSheets(); // 전체 시트 개수

function setFont4EntireSheet() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getDataRange();
  console.log('in changeFont, 시트명:', sheet.getSheetName())
  // range.setFontFamily('Consolas');
  range.setFontFamily('Malgun Gothic');
}

function switchToNextTab() {
  var index = sheet.getIndex();  
  console.log(index, numSheets);
  if (index < numSheets) {
    var nextSheet = ss.getSheets()[index];
    SpreadsheetApp.setActiveSheet(nextSheet);
  }
}

function doSth4AllSheets() {
    for (i=0; i < numSheets; i++) {
      console.log(i, numSheets);
      var nextSheet = ss.getSheets()[i];
      console.log('현재시트', sheet.getSheetName())
      setFont4EntireSheet();
      SpreadsheetApp.setActiveSheet(nextSheet);
      console.log('다음시트', sheet.getSheetName())
    }
}
