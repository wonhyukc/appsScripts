// src로 부터 dst로 prtn에 해당하는 파일을 복사한다.
// sub폴더가 있으면 그것도 모두
// src, dst: folder의 ID
// ptrn: 복사할 파일의 패턴. 예) Copy of, 의 사본
// debug: true, false. 동작 하는 동안 console.log 출력여부
// 정원혁 230227 debug추가

function main() {
  console.log('myFunction-moving files refactored');
  const srcId = 'xxxxxxxxxxkR0ik64ZG_mRYi23'; 
  const sharedDrive = 'xxxxxxANp2vpUk9PVA';

 
  const debug = 0; // consol.log 출력을 보고 싶으면 true 아니면 false

  // Get the source and destination folders by ID
  const src = getFolderById(srcId, debug);
  var dst = getFolderById(sharedDrive, debug);  

  // If both folders were successfully retrieved, start copying  
  if (src && dst) {
    if (debug) {console.log ('원본 대상 모두 OK. 원본폴더: '|| src.getName(), '대상폴더:', dst.getName());}
    dst = copyFirstFolderInDst(src,dst, debug);
    copyFolders(src, dst, '', debug);
    console.log('원본 개수', getFolderFileCount(src, false));
    console.log('대상 개수', getFolderFileCount(dst, 0));    
  }
}

// src 폴더명을 dst에 만든다. 
// dst에 만들어진 folder객체를 리턴한다
function copyFirstFolderInDst(src,dst, debug) {
  if (debug) {console.log ('copyFirstFolderInDst. 폴더 생성전')}
  const dstSubFolder = dst.createFolder(src.getName());
  console.log(src.getName(), dstSubFolder.getName());
  return dstSubFolder;
};


// 현재 폴더에 있는 파일의 개수, 서프폴더 못 센다.
function getFolderFileCount(folder, debug)
{  
  var files = folder.getFiles();
  var count = 0;
  if (debug) {console.log(files.next.name);}
  while ( files.hasNext() ) {
    count++;
    var file = files.next(); // 소모해야지 무한 loop 아니다
    if (debug) {console.log('getFolderFileCount', count, file.getName());}
  }
  return count;
}

function copyFolders(src, dst, ptrn, debug) {
  // Copy files in the top-level folder
  if (debug) {console.log('copyFolders.copyFiles 시작전');}
  copyFiles(src, dst, ptrn, debug);
  // if (debug) {console.log('copyFolders 진입, 다음파일존재?: ', folders.hasNext());}
  if (debug) {console.log('copyFiles끝');}

  // Get all subfolders of the source folder
  if (debug) {console.log ('src.getFolders 직전')};
  const folders = src.getFolders();

  // For each subfolder, create a corresponding subfolder in the destination folder and copy its files
  while (folders.hasNext()) {
    // Define the 'folder' variable before using it
    const folder = folders.next();
    const dstSubFolder = dst.createFolder(folder.getName());
    if (debug) {console.log('copyFolders.while 진입, 복사중: ', folder.getName());}
    copyFolders(folder, dstSubFolder, ptrn,debug);
  }
}
function copyFiles(src, dst, ptrn, debug) {
  // Get all files in the source folder
  const files = src.getFiles();
  console.log('copyFiles 진입, 다음파일존재?: ----------');
  // For each file, check if its name contains the specified pattern, and if so, make a copy in the destination folder
  while (files.hasNext()) {
    const file = files.next();
    if (debug) {console.log('copyFiles. while 에 진입');}
    if (file.getName().indexOf(ptrn) !== -1) {
      if (debug) {console.log('copying:', file.getName());}      
      file.makeCopy(file.getName(), dst);      
    }
  }
}

function getFolderById(folderId, debug) {
  // Try to retrieve a folder with the specified ID; if an error occurs, return null
  try {
    const f = DriveApp.getFolderById(folderId)
    if (debug) {      console.log ('folderId:', folderId, 'folder.getName:', f.getName());      }
    return f;
  } catch(e) {
     if (debug) {       console.log ('folderId:', folderId, 'Error: 아마도 폴더 없거나 접근 불가', e);      }
    return null;
  }
}
