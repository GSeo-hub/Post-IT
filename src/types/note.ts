export type Category = "할 일" | "아이디어" | "기타";
export type PostItColor = "yellow" | "pink" | "green" | "blue";
export type NoteState = "진행중" | "완료";

export interface PostItNote {
  id: string;
  rowIndex?: number;     // 구글 시트 실제 행 번호 (정확한 1:1 타겟팅용)
  datetime: string;      // 구글 시트 B열: 메모생성날짜및시간
  timestamp?: string;     // 구글 시트 A열: 최종 기록 시간
  category: Category;    // 구글 시트 C열: 메모 범주
  content: string;       // 구글 시트 D열: 메모 내용
  color: PostItColor;    // 구글 시트 E열: 숫자 1(yellow), 2(pink), 3(green), 4(blue)
  colorCode?: number;
  state: NoteState;      // 구글 시트 F열: "완료" | "진행중"
  order: number;         // 구글 시트 G열: 정렬 순서
  rotation?: number;     // 회전각 (-3 ~ 3도)
}
