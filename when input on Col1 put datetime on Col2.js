var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getActiveSheet();
var selectedCell = ss.getActiveCell();


/*
  col2Check 컬럼에 입력이 있으면, 우측으로 col2Put 만큼 이동하여 날짜 시각을 입력한다
*/
function putDate(col2Check, col2Put) {
  if( selectedCell.getColumn() == col2Check) {  // col2Check 열에 입력이 있으면
    var dateTimeCell = selectedCell.offset(0,col2Put);  // 현재 셀에서 아래로 0, 오른쪽으로 1 이동
    if (dateTimeCell.isBlank()) { // 날짜 입력할 셀에 값이 없을 때만 자동 입력
      dateTimeCell.setValue(new Date());
    }
  }
}

/*
  col2Check 컬럼에 입력이 있으면, 우측으로 col2Put 만큼 이동하여 날짜 시각 MM/dd HH:00 형식으로 입력한다
  즉, 항상 입력은 절사한 정시
*/
function putSharpHour(col2Check, col2Put) {
  if( selectedCell.getColumn() == col2Check) {  // col2Check 열에 입력이 있으면
    var dateTimeCell = selectedCell.offset(0,col2Put);  // 현재 셀에서 아래로 0, 오른쪽으로 1 이동
    if (dateTimeCell.isBlank()) { // 날짜 입력할 셀에 값이 없을 때만 자동 입력
      // https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html
      // H:	Hour in day (0-23)
      // 강제로 24시 형태로 입력하기 위해 '' 을 MM 앞에 둔다.
      var d2 = Utilities.formatDate(new Date(), "GMT+9", "''MM/dd HH:00");
      // console.log('d2:', d2);
      dateTimeCell.setValue(d2);
    }
  }
}

/* 
	수정이 일어나면 동작한다
*/
function onEdit(e) {
  console.log('onEdit', sheet.getName(), sheet.getSheetName())

  //checks that we're on the correct sheet.
  if( sheet.getSheetName() == 'hourly' ) {
    putDate(1,1);
  }

  // 현재 시각의 00분 을 자동입력한다.
  if( sheet.getSheetName() == 'hourly2' ) {    
    putSharpHour(1,1);    
  }
}
