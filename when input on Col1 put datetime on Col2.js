var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getActiveSheet();
var selectedCell = ss.getActiveCell();

/**
* 1. 'daily' 시트에 대해
* Col2Check 컬럼에 값이 입력되고, putDateCol 셀이 비어 있으면
* 자동으로 오늘 날짜를 입력한다.

* 2. hourly 시트에 대해
* 현재 시각과 가장 가까운 정시를 입력한다.
*/

function insertDate(putDateCol) {
  // 현재시각을 입력
  var dateTimeCell = selectedCell.offset(0,putDateCol);  // 현재 셀에서 아래로 0, 오른쪽으로 putDateCol 이동
  // console.log('insertDate', dateTimeCell, putDateCol);
  if (dateTimeCell.isBlank()) { // 날짜 입력할 셀에 값이 없을 때만 자동 입력, 정원혁 20110521
    dateTimeCell.setValue(new Date());
  }
}    

function insertDateSharpHour(putDateCol) {
  // 현재시각 절사하여 00분 을 입력
  var dateTimeCell = selectedCell.offset(0,putDateCol);  // 현재 셀에서 아래로 0, 오른쪽으로 putDateCol 이동
  // console.log('insertDate', dateTimeCell, putDateCol);
  if (dateTimeCell.isBlank()) { // 날짜 입력할 셀에 값이 없을 때만 자동 입력, 정원혁 20110521    
    // https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html
    // H:	Hour in day (0-23)
    // 강제로 24시 형태로 입력하기 위해 '' 을 MM 앞에 둔다.
    // var d2 = Utilities.formatDate(new Date(), "GMT+9", "MM-dd HH:00");         
    var d2 = Utilities.formatDate(new Date(), "GMT+9", "''MM-dd HH:00");         
    console.log('d2:', d2);        
    dateTimeCell.setValue(d2);
  }
}    

function onEdit(e) {
  console.log('onEdit', sheet.getName(), sheet.getSheetName())

  //checks that we're on the correct sheet.
  if( sheet.getSheetName() == 'daily' ) {
    console.log('daily')
    var Col2Check = 1;   //트리거가 동작할 컬럼 번호  A==1, B==2
    if( selectedCell.getColumn() == Col2Check) {
      // console.log('onEdit', selectedCell, Col2Check);
      insertDate(1);  // 오른쪽 몇번째 이동해서 날짜를 입력할까? 마이너스이면 왼쪽 
    }
  }

  // 현재 시각의 00분 을 자동입력한다.
  if( sheet.getSheetName() == 'hourly' ) {
    console.log('hourly 진입')
    var Col2Check = 1;   //트리거가 동작할 컬럼 번호  A==1, B==2    
    if( selectedCell.getColumn() == Col2Check) { //이름 입력되면      
      insertDateSharpHour(1); // 오른쪽 몇번째 이동해서 날짜를 입력할까? 마이너스이면 왼쪽 
    }
  }
}
