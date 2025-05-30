// src로 부터 dst로 prtn에 해당하는 파일을 복사한다.
// sub폴더가 있으면 그것도 모두
// src, dst: folder의 ID
// ptrn: 복사할 파일의 패턴. 예) Copy of, 의 사본
// debug: true, false. 동작 하는 동안 console.log 출력여부
// 정원혁 230227 debug추가

function main() {  
  var srcId = '1FhXiuhUSdR2-rJM3TSvokQsXwG0mYAZL'; //tmp test  
  // 주의: 공유드라이브 루트에는 복사 불가. 서브 폴더 만들고 이를 사용해야 한다.
  const sharedDrive = '0AA8hEjLc1U_KUk9PVA';

 
  const debug = 1; // consol.log 출력을 보고 싶으면 true 아니면 false
  if (debug) {console.log('start --- copy files: works well')};
  // Get the source and destination folders by ID
  const src = getFolderById(srcId, debug);
  const dst = getFolderById(sharedDrive, debug);
  
  console.log(makeCopyBatch('1vJP27azrN7-T_TolJkCWu6MR6t3RIGNW', sharedDrive));

  // If both folders were successfully retrieved, start copying  
  // if (src && dst) {
  //   if (debug) {console.log ('원본 대상 모두 OK. 원본폴더: '|| src.getName(), '대상폴더:', dst.getName());}
  //   // dst = copyFirstFolderInDst(src,dst, debug);
  
  //   copyFolders(src, dst, '', debug);
  //   if (debug) {console.log('원본 개수', getFolderFileCount(src, false))};
  //   if (debug) {console.log('대상 개수', getFolderFileCount(dst, 0))};    
  // }
}











// https://github.com/tanaikech/BatchRequest#how-to-install 에 있는 방식으로 되려면 뭘 더해야 할까?

// 단일 폴더에 파일이 존재할때만 동작하는 듯
function makeCopyDriveApi(srcFolderId, dstFolderId) {
  var srcFolder = DriveApp.getFolderById(srcFolderId);
  var dstFolder = DriveApp.getFolderById(dstFolderId);
  var files = srcFolder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var f = file.makeCopy(dstFolder);
    if (file.getMimeType() == MimeType.GOOGLE_APPS_SCRIPT) {
      Drive.Files.update({"parents": [{"id": dstFolderId}]}, f.getId());
      if(debug){console.log('.');}
    }
  }
}














// function batch3() {
//   var body = [
//     {
//       method: "PATCH",
//       endpoint: "https://www.googleapis.com/drive/v3/files/### fileId ###?fields=name",
//       requestBody: {"name": "samplename1"}
//     },
//     {
//       method: "PATCH",
//       endpoint: "https://www.googleapis.com/drive/v3/files/### fileId ###?fields=name",
//       requestBody: {"name": "samplename2"}
//     }
//   ];

//   var url = "https://www.googleapis.com/batch";
//   var boundary = "xxxxxxxxxx";
//   var contentId = 0;
//   var data = "--" + boundary + "\r\n";
//   for (var i in body) {
//     data += "Content-Type: application/http\r\n";
//     data += "Content-ID: " + ++contentId + "\r\n\r\n";
//     data += body[i].method + " " + body[i].endpoint + "\r\n";
//     data += body[i].requestBody ? "Content-Type: application/json; charset=utf-8\r\n\r\n" : "\r\n";
//     data += body[i].requestBody ? JSON.stringify(body[i].requestBody) + "\r\n" : "";
//     data += "--" + boundary + "\r\n";
//   }
//   var payload = Utilities.newBlob(data).getBytes();
//   var options = {
//     method: "post",
//     contentType: "multipart/mixed; boundary=" + boundary,
//     payload: payload,
//     headers: {'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()},
//     muteHttpExceptions: true,
//   };
//   var res = UrlFetchApp.fetch(url, options).getContentText();
//   Logger.log(res);
// }



// function renameFilesInFolderBatch(folderId) {  
//   const list = Drive.Files.list({ q: `'${folderId}' in parents and trashed=false`, fields: "items(id,title)" }).items;
//   const requests = list.map(({ id, title }) => ({
//     method: "PATCH",
//     endpoint: `https://www.googleapis.com/drive/v3/files/${id}`,
//     requestBody: { name: `${title}_updated` }
//   }));
//   const object = { batchPath: "batch/drive/v3", requests };
//   const res = batchRequests(object);
//   if (res.getResponseCode() != 200) {
//     throw new Error(res.getContentText());
//   }
// }

// function renameFilesInFolder(folderId) {
//   const files = DriveApp.getFolderById(folderId).getFiles();
//   while (files.hasNext()) {
//     const file = files.next();
//     const oldName = file.getName();
//     const newName = `${oldName}_upadted`;
//     file.setName(newName);
//   }
// }


/**
 * Lists the top-level folders in the user's Drive.
 */
function listRootFolders() {
  const query = '"root" in parents and trashed = false and ' +
    'mimeType = "application/vnd.google-apps.folder"';
  let folders;
  let pageToken = null;
  do {
    try {
      folders = Drive.Files.list({
        q: query,
        maxResults: 100,
        pageToken: pageToken
      });
      if (!folders.items || folders.items.length === 0) {
        console.log('No folders found.');
        return;
      }
      for (let i = 0; i < folders.items.length; i++) {
        const folder = folders.items[i];
        console.log('%s (ID: %s)', folder.title, folder.id);
      }
      pageToken = folders.nextPageToken;
    } catch (err) {
      // TODO (developer) - Handle exception
      console.log('Failed with error %s', err.message);
    }
  } while (pageToken);
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
  if (debug) {console.log('copyFiles 진입, 다음파일존재?: ----------')};
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
