var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getActiveSheet();
var selectedCell = ss.getActiveCell();

function test() {  //예제 
  // 활성 시트 이름을 가져오는 다양한 방법
  // var actualSheetName = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();
  // var actualSheetName = sheet.getSheetName();
  var actualSheetName = sheet.getName();
  console.log('활성시트:', actualSheetName)

  // 현재 행, 값 가져오기
  var currentSelection = SpreadsheetApp.getActiveSheet().getActiveSelection()
  var currentValue = currentSelection.getValue();
  var currentRow = currentSelection.getRowIndex();
  var currentCol = currentSelection.getColumn();
  console.log('현재 값, 행, 열', currentValue, currentRow, currentCol); 
}

