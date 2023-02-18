// 구글 공식 튜토리얼
// https://developers.google.com/apps-script/guides/slides/presentations?hl=ko

var presentation = SlidesApp.getActivePresentation()
var selection = presentation.getSelection();
var currentPage = selection.getCurrentPage();  // 현재 작업 중인 슬라이드이 페이지지
var selectionType = selection.getSelectionType();

function copySlide2TitleToCurrent(){
  if (currentPage != null) {
    Logger.log('Selected current active page ID: ' + currentPage.getObjectId());
  }
  var slide = presentation.getSlides()[1];
  var ele = slide.getPageElements()[0];
  currentPage.insertPageElement(ele);
}
  // createNewSlideAndPaste(slidesLength, ele)  // 마지막 슬라이드에 새 슬라이드 삽입. 제목 붙여넣기
  // slide.move(4); // 슬라이드를 이동

function copySlide2TitleToNewLast(){
  var slide = presentation.getSlides()[2];  // 원본이 될 슬라이드 번호
  var slidesLength = presentation.getSlides().length;
  console.log (slidesLength);
  var ele = slide.getPageElements()[0];
  // console.log (slidesLength, title, ele);
  createNewSlideAndPaste(slidesLength, ele)  // 마지막 슬라이드에 새 슬라이드 삽입. 제목 붙여넣기
}


function getTitleBody(slideNo){
  //제목, 본문: 없으면 오류
  var slide = presentation.getSlides()[slideNo];
  var slidesLength = presentation.getSlides().length;
  console.log (slidesLength);  
  var title = slide.getPageElements()[0].asShape().getText().asString() //첫번째 요소 = 제목
  var body = slide.getPageElements()[1].asShape().getText().asString()  //두번째 = 본문 불릿
  console.log (slidesLength, title, body);

  return [title, body]; 
}

// 새로 만들 들라이드 위치, 복사할 element
function createNewSlideAndPaste(slideNo, ele) {
  // 새로운 슬라이드에 넣기
  var newS = presentation.insertSlide(slideNo);
  newS.insertPageElement(ele);
}
