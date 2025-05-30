/**
 * @OnlyCurrentDoc
 */

// --- Configuration ---
const SHEET_NAME = "USD_fifo"; // 실제 시트 이름으로 변경하세요.
const HEADER_ROW = 2;       // 헤더 행 번호 (데이터는 이 행 아래부터 시작)
const COL_C_AMOUNT = 3;     // C열 (외화 금액)
const COL_D_RATE = 4;       // D열 (환율)
const COL_E_KRW = 5;        // E열 (원화 금액)
const COL_F_BALANCE = 6;    // F열 (외화 총잔액 - 새로운 위치, 스크립트가 값을 씀)
const COL_G_REMAINING = 7;  // G열 (FIFO 후 남은 잔액)
const COL_H_FIFO_COST = 8;  // H열 (FIFO 원가)
const COL_I_PROFIT_LOSS = 9; // I열 (환차손익)
// J열은 메모 (스크립트에서 사용 안 함)
// K열은 krw잔고 (스크립트에서 직접 계산하거나 사용 안 함, E열 기반으로 계산될 수 있음)
const RESET_THRESHOLD = 0.3; // 리셋 기준 값 (F열)
// --- End Configuration ---




/**
 * Convert column letter to column number
 * 호출: getColumnNumber('A')
 * 리턴: 1 컬럼번호
 */
function getColumnNumber(column) {
  return column.toUpperCase().charCodeAt(0) - 64;
}

/*
  col2Check 컬럼에 입력이 있으면, 우측으로 col2Put 만큼 이동하여 날짜 시각을 입력한다
*/
function putDate(selectedCell, col2Check, col2Put) {
  console.log('putDate:', col2Check, col2Put);

  if (selectedCell.getColumn() === col2Check) {  // col2Check 열에 입력이 있으면
    const dateTimeCell = selectedCell.offset(0, col2Put);  // 현재 셀에서 우측으로 col2Put 만큼 이동
    if (dateTimeCell.isBlank()) { // 날짜 입력할 셀에 값이 없을 때만 자동 입력
      dateTimeCell.setValue(new Date());
    }
  }
}


/**
 * 시트가 수정될 때 자동으로 실행될 트리거 함수입니다.
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e 이벤트 객체
 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const editedRow = range.getRow();
  const editedCol = range.getColumn();
  const ui = SpreadsheetApp.getUi(); // UI 객체 가져오기

  // 'log' 시트 처리 (기존 로직 유지)
  if (sheet.getSheetName() === 'log') {
    putDate(range, 5, -1); // E에 입력이 되면 D에 현재시각 입력
    putDate(range, 8, -1); // H에 입력이 되면 G에 현재시각 입력
  }

  // 1. 올바른 시트인지, 헤더 행 아래인지 확인
  if (sheet.getName() !== SHEET_NAME || editedRow <= HEADER_ROW) {
    return;
  }

  // 이후 모든 작업은 SHEET_NAME 에만 적용
  // C열(외화금액)에 입력이 되면 B열(날짜)에 현재시각 입력
  putDate(range, COL_C_AMOUNT, -1);

  // 2. C열에 음수 값이 입력되었을 때 외화 잔고 확인
  if (editedCol === COL_C_AMOUNT && range.getValue() < 0) {
    const currentAmount = Number(range.getValue()); // 현재 입력된 매도 금액 (음수)

    // 외화 총잔액 (COL_F_BALANCE)은 스크립트가 계산하여 F열에 직접 쓸 값입니다.
    // onEdit 시점에 F열의 수식이 아직 업데이트되지 않았을 수 있으므로
    // 가장 정확한 외화잔고는 직전 행의 F열 값을 참조하거나, calculateFIFO 내부에서 계산된 값을 사용하는 것이 좋습니다.
    // 여기서는 onEdit 시 사용자에게 즉시 피드백을 주기 위해 직전 행의 F열을 참고합니다.
    const prevBalance = Number(sheet.getRange(editedRow - 1, COL_F_BALANCE).getValue() || 0);

    Logger.log(`onEdit: 현재 입력된 금액 (C열): ${currentAmount}, 직전 행 외화 잔고 (F열): ${prevBalance}`);

    if (Math.abs(currentAmount) > prevBalance) {
      ui.alert(
        '경고: 매도 금액 초과',
        `입력하신 매도 금액 (${Math.abs(currentAmount)} USD)이 현재 외화 잔고 (${prevBalance} USD)보다 많습니다.\n다시 확인해주세요.`,
        ui.ButtonSet.OK
      );
      // 필요하다면 여기에 range.setValue("") 또는 range.clearContent() 를 추가하여
      // 잘못된 입력을 지우는 로직을 넣을 수 있습니다.
    }
  }


  // 3. 계산에 영향을 주는 열(C 또는 D)이 수정되었는지 확인
  if (editedCol === COL_C_AMOUNT || editedCol === COL_D_RATE) {
    try {
      updateFIFOAndWrite(); // 전체 재계산 및 쓰기 함수 호출
    } catch (error) {
      SpreadsheetApp.getActiveSpreadsheet().toast("FIFO 계산 중 오류 발생: " + error.message, "오류", 30);
      Logger.log("Error during FIFO update: " + error);
    }
  }
  // TODO: 행 추가/삭제 시 처리 로직 추가 필요
}

/**
 * FIFO 계산을 수행하고 결과를 시트에 쓰는 메인 함수입니다.
 * (나중에는 onEdit에서 필요한 부분만 계산하도록 수정 가능)
 */
function updateFIFOAndWrite() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log("Sheet not found: " + SHEET_NAME);
    return;
  }

  // HEADER_ROW + 1 부터 데이터 시작
  const dataRange = sheet.getRange(HEADER_ROW + 1, 1, sheet.getLastRow() - HEADER_ROW, sheet.getLastColumn());
  const data = dataRange.getValues();

  // 데이터가 없으면 종료
  if (data.length === 0) {
    Logger.log("No data found below header row.");
    return;
  }

  // --- FIFO 계산 로직 호출 ---
  const results = calculateFIFO(data);

  // --- 결과 시트 쓰기 ---
  if (results) {
    // 각 결과 배열을 2D 배열로 변환 (setValues를 위해)
    const fValues = results.fValues.map(val => [val]); // F열 (외화 총잔액)
    const gValues = results.gValues.map(val => [val]); // G열 (FIFO 후 남은 잔액)
    const hValues = results.hValues.map(val => [val]); // H열 (FIFO 원가)
    const iValues = results.iValues.map(val => [val]); // I열 (환차손익)

    // 각 열에 결과 쓰기 (데이터 시작 행부터, 즉 HEADER_ROW + 1 부터)
    sheet.getRange(HEADER_ROW + 1, COL_F_BALANCE, fValues.length, 1).setValues(fValues);
    sheet.getRange(HEADER_ROW + 1, COL_G_REMAINING, gValues.length, 1).setValues(gValues);
    sheet.getRange(HEADER_ROW + 1, COL_H_FIFO_COST, hValues.length, 1).setValues(hValues);
    sheet.getRange(HEADER_ROW + 1, COL_I_PROFIT_LOSS, iValues.length, 1).setValues(iValues);
    SpreadsheetApp.flush(); // 변경사항 즉시 적용
  }
}



/**
 * FIFO 계산 로직을 수행하는 함수입니다. (리셋 로직 및 컬럼 조정 포함)
 * @param {Array[]} data - 시트에서 읽어온 데이터 (2차원 배열).
 * @return {object|null} 계산 결과 { fValues, gValues, hValues, iValues } 또는 오류 시 null.
 */
function calculateFIFO(data) {
  let buyLots = []; // 매수 재고 상태: { originalQty, rate, remainingQty, rowIndex }
  let lastResetRowIndex = -1; // 마지막 리셋 지점 행 인덱스 (0부터 시작)

  let fValues = []; // F열 (외화 총잔액) 결과 배열
  let gValues = []; // G열 (FIFO 후 남은 잔액) 결과 배열
  let hValues = []; // H열 (FIFO 원가) 결과 배열
  let iValues = []; // I열 (환차손익) 결과 배열

  let currentTotalBalance = 0; // 누적 외화 총잔액 (스크립트가 직접 계산)

  // --- 1단계: F, H, I열 계산 및 매수 재고 상태 업데이트 ---
  for (let i = 0; i < data.length; i++) {
    const currentRowIndexInData = i; // data 배열 내의 0부터 시작하는 인덱스
    const currentRowInSheet = currentRowIndexInData + HEADER_ROW + 1; // 실제 시트 행 번호 (1부터 시작)

    // 현재 행 데이터 읽기 (상수에 맞게 컬럼 인덱스 조정)
    // data 배열은 0부터 시작하므로 COL_XX - 1 로 접근
    const amount = Number(data[i][COL_C_AMOUNT - 1] || 0); // C열
    const rate = Number(data[i][COL_D_RATE - 1] || 0);     // D열
    const krwAmount = Number(data[i][COL_E_KRW - 1] || 0); // E열

    // 기본값 초기화
    let hValue = null; // FIFO 원가 (H열)
    let iValue = null; // 환차손익 (I열)

    // *** 현재 행 계산에 사용할 리셋 인덱스 저장 (루프 시작 시점의 buyLots 상태 기준) ***
    // 이 값은 현재 행을 처리하기 전에 이미 확정된 마지막 리셋 지점입니다.
    const currentLastResetIndex = lastResetRowIndex;

    // C열 또는 D열이 숫자가 아니면 계산 로직 건너뛰기
    if (isNaN(amount) || isNaN(rate)) {
        // H, I는 null로 푸시됨 (아래 push 로직에서 처리)
    } else if (amount > 0) { // 매수 건
      buyLots.push({
        originalQty: amount, rate: rate, remainingQty: amount, rowIndex: currentRowIndexInData
      });
      hValue = null; iValue = null; // 매수 건은 FIFO 원가, 환차손익 없음

    } else if (amount < 0) { // 매도 건
        Logger.log("--- Processing Sell Row: " + currentRowInSheet + ", Amount: " + amount + " ---");
        // 리셋 이후의 유효한 buyLots만 로그에 표시
        Logger.log("BuyLots state BEFORE processing sell (filtered by currentLastResetIndex): " + JSON.stringify(buyLots.filter(lot => lot.rowIndex > currentLastResetIndex)));
        Logger.log("Using Last Reset Row Index for calculation: " + currentLastResetIndex);

      const amountToCover = Math.abs(amount); // 양수로 변환
      let totalFifoCost = 0;
      let remainingSellQty = amountToCover;
      let foundExactMatch = false;

      // [1] 같은 금액 매칭 시도 (리셋 이후의 건들만 고려)
      Logger.log("Checking for exact match...");
      // buyLots 배열을 순회하며, 리셋 이후의 유효한 로트만 검사
      for (let lotIndex = 0; lotIndex < buyLots.length; lotIndex++) {
        let lot = buyLots[lotIndex];
        // 리셋 이후의, 아직 남아있고, 원본수량==매도량, 남은수량==원본수량 인 건
        if (lot.rowIndex > currentLastResetIndex && // 리셋 지점보다 나중에 발생한 매수 건만 고려
            lot.remainingQty > 0 &&
            lot.originalQty === amountToCover &&
            lot.remainingQty === lot.originalQty)
        {
          totalFifoCost = amountToCover * lot.rate;
          lot.remainingQty = 0; // 해당 로트 모두 소진
          remainingSellQty = 0; // 매도 금액 모두 처리
          foundExactMatch = true;
          Logger.log(" Exact match FOUND! Consumed lot from row index " + lot.rowIndex + ". Calculated Cost: " + totalFifoCost);
          break; // 정확한 매칭을 찾았으므로 더 이상 로트 순회 필요 없음
        }
      }

      // [2] 표준 FIFO 처리 (같은 금액 매칭 실패 시)
      if (!foundExactMatch) {
        Logger.log("Exact match not found. Starting standard FIFO...");
        // buyLots 배열을 순회하며, 리셋 이후의 유효한 로트만 FIFO 처리
        for (let lotIndex = 0; lotIndex < buyLots.length; lotIndex++) {
          let lot = buyLots[lotIndex];
          // 리셋 이후의, 아직 남아있는 매수 건
          if (lot.rowIndex > currentLastResetIndex && lot.remainingQty > 0) {
            const consumeAmount = Math.min(remainingSellQty, lot.remainingQty);
            if (consumeAmount > 0) {
                totalFifoCost += consumeAmount * lot.rate;
                lot.remainingQty -= consumeAmount;
                remainingSellQty -= consumeAmount;
                Logger.log(" FIFO: Consumed " + consumeAmount + " from lot at index " + lot.rowIndex +
                           ". Remaining sell qty: " + remainingSellQty + ". Lot remaining qty: " + lot.remainingQty);
            }
          }
          if (remainingSellQty <= 0.000001) { // 부동 소수점 오차 처리 (거의 0이면 0으로 간주)
                remainingSellQty = 0;
                break; // 매도 금액 모두 처리되었으므로 중단
          }
        }
      }

      // H열 (FIFO 원가) 및 I열 (환차손익) 값 결정
      if (remainingSellQty > 0) { // 매도 금액을 모두 처리하지 못한 경우
        hValue = "#N/A"; iValue = "#N/A"; // "Not Available" 또는 오류 표시
        Logger.log("Insufficient buy lots for sell at row " + currentRowInSheet + ". Remaining needed: " + remainingSellQty);
      } else {
        hValue = totalFifoCost; // FIFO 원가
        // 환차손익 계산 (E열 원화 금액 - H열 FIFO 원가)
        if (!isNaN(krwAmount) && typeof hValue === 'number') {
              iValue = krwAmount - hValue;
        } else if (hValue === "#N/A") {
              iValue = "#N/A";
        } else { // 기타 계산 오류
              iValue = "#ERROR";
              Logger.log("Error calculating I value for row " + currentRowInSheet + ". E=" + krwAmount + ", H=" + hValue);
        }
      }
        Logger.log("Final H value for row " + currentRowInSheet + ": " + hValue);
        Logger.log("Final I value for row " + currentRowInSheet + ": " + iValue);
        // 처리 후 남은 유효한 buyLots 상태를 로깅 (디버깅용)
        Logger.log("BuyLots state AFTER processing sell (filtered by currentLastResetIndex): " + JSON.stringify(buyLots.filter(lot => lot.rowIndex > currentLastResetIndex)));

    } else { // amount === 0 또는 유효하지 않은 C,D 값 등
        hValue = null; iValue = null; // 해당 열 값 비워두기
    }

    // --- F열 (외화 총잔액) 계산 ---
    currentTotalBalance += amount; // 현재 행의 외화 금액을 누적 잔액에 더함
    fValues.push(currentTotalBalance); // F열 (외화 총잔액)에 추가

    // 현재 행의 계산이 끝난 후 H, I 값을 배열에 푸시
    hValues.push(hValue);
    iValues.push(iValue);

    // --- *** 다음 행 계산을 위해 리셋 인덱스 업데이트 (현재 행 처리 후) *** ---
    // 현재 누적 잔액 (currentTotalBalance)이 RESET_THRESHOLD 미만이면 리셋 지점
    if (!isNaN(currentTotalBalance) && currentTotalBalance < RESET_THRESHOLD) {
      lastResetRowIndex = currentRowIndexInData; // 현재 처리 중인 행의 인덱스를 리셋 지점으로 기록
      Logger.log("Reset index updated to " + lastResetRowIndex + " based on total balance check at row " + currentRowInSheet + ". New Balance: " + currentTotalBalance);
      // buyLots 배열을 여기서 비우지 않아도, 다음 루프에서 currentLastResetIndex 기준으로 필터링하므로 문제 없음
    }

  } // End of data loop (Pass 1)

  // --- 2단계: 최종 매수 재고 상태를 기반으로 G열 (거래후잔액) 계산 ---
  Logger.log("--- Calculating G values (Pass 2) ---");
  // buyLots 배열을 순회하며 remainingQty 값을 사용하여 G열을 계산
  for (let i = 0; i < data.length; i++) {
      const amount = Number(data[i][COL_C_AMOUNT - 1] || 0);
      let gValue = null; // G열 (FIFO 후 남은 잔액)

      if (isNaN(amount)) {
          gValue = null;
      } else if (amount > 0) { // 매수 건인 경우에만 남은 잔액이 발생할 수 있음
          const lotState = buyLots.find(lot => lot.rowIndex === i);
          if (lotState) {
              // 부동 소수점 오차를 고려하여 0에 가까우면 0으로 처리
              gValue = (Math.abs(lotState.remainingQty) < 0.000001) ? 0 : lotState.remainingQty;
          } else {
              gValue = 0; // 해당 rowIndex의 buyLot을 찾을 수 없는 경우 (예: 스크립트가 인식 못하는 매수 건)
          }
      } else { // 매도 건이거나 금액이 0인 경우 G열은 0
          gValue = 0;
      }
      gValues.push(gValue);
  } // End of Pass 2
  Logger.log("--- FIFO Calculation Complete ---");

  // 계산된 모든 결과 배열 반환
  return { fValues, gValues, hValues, iValues };
}