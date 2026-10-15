/**
 * 구글 스프레드시트 기반 포스트잇 Todo List CRUD Apps Script
 * 스프레드시트 URL: https://docs.google.com/spreadsheets/d/1DhW5p1YquSM5LWyJ7f2D7smoFPhs_vynV4LLUOSFg4U/edit
 *
 * 컬럼 구성 (1행 헤더):
 * A: timestamp (시트기록날짜및시간, Date)
 * B: datetime (메모생성날짜및시간, Date/String)
 * C: category (메모범주, String: 할 일, 아이디어, 기타 등)
 * D: content (메모내용, String)
 * E: color (메모색상, Number 또는 Color Code)
 * F: state (완료상태, String: "완료" / "진행중")
 * G: order (메모순서, Number)
 */

const SHEET_NAME = "시트1"; // 스프레드시트의 탭 이름 (필요시 변경)
const SPREADSHEET_ID = "1DhW5p1YquSM5LWyJ7f2D7smoFPhs_vynV4LLUOSFg4U";

/**
 * 스프레드시트 활성 시트 가져오기
 */
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

/**
 * 초기 시트 헤더 세팅 함수 (필요 시 최초 1회 실행)
 */
function initSheet() {
  const sheet = getSheet();
  const headers = [
    "timestamp", // A열: 시트기록날짜및시간
    "datetime",  // B열: 메모생성날짜및시간
    "category",  // C열: 메모범주
    "content",   // D열: 메모내용
    "color",     // E열: 메모색상
    "state",     // F열: 완료상태
    "order"      // G열: 메모순서
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

/**
 * Web App GET 요청 핸들러 (Read)
 */
function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const action = (e && e.parameter && e.parameter.action) || "read";

    if (action === "read") {
      const data = getNotes();
      return respondJson({ success: true, data: data });
    }

    return respondJson({ success: false, message: "지원하지 않는 GET 액션입니다." });
  } catch (err) {
    return respondJson({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Web App POST 요청 핸들러 (Create, Update, Delete, Batch Update)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    let result;
    switch (action) {
      case "create":
        result = createNote(postData.note);
        break;
      case "update":
        result = updateNote(postData.note);
        break;
      case "delete":
        result = deleteNote(postData.order, postData.datetime, postData.rowIndex);
        break;
      case "toggleState":
        result = toggleNoteState(postData.order, postData.datetime, postData.state, postData.rowIndex);
        break;
      case "reorder":
        result = updateNoteOrders(postData.orders);
        break;
      default:
        throw new Error("유효하지 않은 요청 액션(action)입니다: " + action);
    }

    return respondJson({ success: true, result: result });
  } catch (err) {
    return respondJson({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 1. Read: 전체 메모 목록 읽어오기
 */
function getNotes() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const notes = values.map((row, index) => {
    return {
      rowIndex: index + 2,
      timestamp: row[0] instanceof Date ? Utilities.formatDate(row[0], "Asia/Seoul", "yyyy-MM-dd HH:mm:ss") : row[0],
      datetime: row[1] instanceof Date ? Utilities.formatDate(row[1], "Asia/Seoul", "yyyy-MM-dd HH:mm:ss") : row[1],
      category: row[2] || "기타",
      content: row[3] || "",
      color: Number(row[4]) || 1, // 1: 노랑, 2: 분홍, 3: 초록, 4: 파랑 등 숫자 매핑
      state: row[5] || "진행중", // "완료" or "진행중"
      order: Number(row[6]) || index + 1
    };
  });

  // order 기준 오름차순 정렬
  notes.sort((a, b) => a.order - b.order);
  return notes;
}

/**
 * 2. Create: 새 메모 추가
 */
function createNote(note) {
  const sheet = getSheet();
  const now = new Date();
  const timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
  const datetime = note.datetime || timestamp;
  const category = note.category || "할 일";
  const content = note.content || "";
  const color = Number(note.color) || 1;
  const state = note.state || "진행중";
  
  // 기본 순서는 마지막 순서 + 1
  const lastRow = sheet.getLastRow();
  let order = Number(note.order);
  if (!order) {
    order = lastRow <= 1 ? 1 : lastRow;
  }

  sheet.appendRow([
    timestamp,
    datetime,
    category,
    content,
    color,
    state,
    order
  ]);

  return { message: "메모가 성공적으로 추가되었습니다.", order: order, timestamp: timestamp };
}

/**
 * 3. Update: 메모 내용/범주/색상/순서 수정
 */
function updateNote(note) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("수정할 메모가 없습니다.");

  let targetRow = -1;

  if (note.rowIndex && note.rowIndex >= 2 && note.rowIndex <= lastRow) {
    targetRow = note.rowIndex;
  } else {
    const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][1]) === String(note.datetime)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow === -1) {
    throw new Error("수정 대상 메모를 찾을 수 없습니다.");
  }

  const now = new Date();
  const timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  if (note.category !== undefined) sheet.getRange(targetRow, 3).setValue(note.category);
  if (note.content !== undefined) sheet.getRange(targetRow, 4).setValue(note.content);
  if (note.color !== undefined) sheet.getRange(targetRow, 5).setValue(Number(note.color));
  if (note.state !== undefined) sheet.getRange(targetRow, 6).setValue(note.state);
  if (note.order !== undefined) sheet.getRange(targetRow, 7).setValue(Number(note.order));
  sheet.getRange(targetRow, 1).setValue(timestamp); // 최종 수정 시간 기록

  return { message: "메모가 수정되었습니다.", rowIndex: targetRow };
}

/**
 * 4. Delete: 메모 삭제
 */
function deleteNote(order, datetime, rowIndex) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("삭제할 메모가 없습니다.");

  let targetRow = -1;

  if (rowIndex && rowIndex >= 2 && rowIndex <= lastRow) {
    targetRow = rowIndex;
  } else {
    const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][1]) === String(datetime)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow === -1) {
    throw new Error("삭제할 메모를 찾을 수 없습니다.");
  }

  sheet.deleteRow(targetRow);
  return { message: "메모가 삭제되었습니다.", deletedRow: targetRow };
}

/**
 * 5. State Toggle: 완료 여부 변경 ("완료" / "진행중")
 */
function toggleNoteState(order, datetime, state, rowIndex) {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("메모가 없습니다.");

  let targetRow = -1;

  if (rowIndex && rowIndex >= 2 && rowIndex <= lastRow) {
    targetRow = rowIndex;
  } else {
    const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][1]) === String(datetime)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow === -1) {
    throw new Error("대상 메모를 찾을 수 없습니다.");
  }

  const newState = state || (values[targetRow - 2][5] === "완료" ? "진행중" : "완료");
  sheet.getRange(targetRow, 6).setValue(newState);
  sheet.getRange(targetRow, 1).setValue(Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss"));

  return { message: "상태가 변경되었습니다.", state: newState };
}

/**
 * 6. Reorder: 드래그 앤 드롭 일괄 순서(order) 갱신
 * orders: [{ datetime: "...", order: 1 }, { datetime: "...", order: 2 }, ...]
 */
function updateNoteOrders(orders) {
  if (!orders || !Array.isArray(orders)) throw new Error("orders 배열이 올바르지 않습니다.");

  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { message: "메모가 없습니다." };

  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();

  orders.forEach(item => {
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][1]) === String(item.datetime)) {
        sheet.getRange(i + 2, 7).setValue(Number(item.order));
        break;
      }
    }
  });

  return { message: "순서가 모두 갱신되었습니다." };
}

/**
 * JSON 응답 유틸리티 함수
 */
function respondJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
