var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getActiveSheet();
var selectedCell = ss.getActiveCell();


//번역기----------------------------------------------------------------------------
// 셀에 메모를 추가한다.
function addNote() {
  pass
  var comments = selectedCell.getComment();
  // Newline works in msgBox, but not in Note.
  comments = comments + "\\nModified: " + (new Date());

  selectedCell.setComment(comments);
}

function onOpen(e) { 
 SpreadsheetApp.getUi()
  pass
     .createMenu('Translation')
     .addItem('Ko to Eng','trans')

     .addToUi();
}

function trans () {
  var range = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getActiveRange();
  var trans = range.getValues().map(row => [LanguageApp.translate (row,'ko','en')])

  // 셀 값을 변경하지 말고 셀에 메모를 추가하도록 고쳐보자
  // range.offset(0,0).setValues(trans)
  selectedCell.setComment(trans);
}
