import { PostItNote, Category, NoteState } from "@/types/note";
import { COLOR_CONFIG, getColorFromCode } from "@/lib/note-utils";

const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";

/**
 * 구글 앱스 스크립트 API 서비스
 */
export const googleSheetService = {
  /**
   * 1. 전체 메모 조회 (Read)
   */
  async fetchNotes(): Promise<PostItNote[]> {
    if (!SCRIPT_URL) {
      console.warn("NEXT_PUBLIC_GOOGLE_SCRIPT_URL 이 설정되지 않았습니다.");
      return [];
    }

    try {
      const res = await fetch(`${SCRIPT_URL}?action=read`, {
        method: "GET",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        return data.data.map((item: any, idx: number) => {
          const rotation = Number((Math.sin(idx + 1) * 2.5).toFixed(1));
          const uniqueId = `note-${item.rowIndex || idx + 2}-${Date.now()}-${idx}`;
          return {
            id: uniqueId,
            rowIndex: item.rowIndex ? Number(item.rowIndex) : undefined,
            datetime: String(item.datetime || ""),
            timestamp: String(item.timestamp || ""),
            category: (item.category as Category) || "할 일",
            content: String(item.content || ""),
            color: getColorFromCode(item.color),
            colorCode: Number(item.color) || 1,
            state: (item.state === "완료" ? "완료" : "진행중") as NoteState,
            order: Number(item.order) || idx + 1,
            rotation: rotation,
          };
        });
      }
      return [];
    } catch (error) {
      console.error("fetchNotes 실패:", error);
      throw error;
    }
  },

  /**
   * 2. 메모 생성 (Create)
   */
  async createNote(note: {
    datetime: string;
    category: Category;
    content: string;
    color: number;
    state: NoteState;
    order: number;
  }) {
    if (!SCRIPT_URL) return;

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "create",
          note,
        }),
      });
    } catch (error) {
      console.error("createNote 실패:", error);
    }
  },

  /**
   * 3. 메모 수정 (Update)
   */
  async updateNote(note: {
    datetime: string;
    content?: string;
    category?: Category;
    color?: number;
    state?: NoteState;
    order?: number;
    rowIndex?: number;
  }) {
    if (!SCRIPT_URL) return;

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "update",
          note,
        }),
      });
    } catch (error) {
      console.error("updateNote 실패:", error);
    }
  },

  /**
   * 4. 메모 상태 토글 (진행중 <-> 완료)
   */
  async toggleNoteState(
    datetime: string,
    state: NoteState,
    order?: number,
    rowIndex?: number
  ) {
    if (!SCRIPT_URL) return;

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "toggleState",
          datetime,
          state,
          order,
          rowIndex,
        }),
      });
    } catch (error) {
      console.error("toggleNoteState 실패:", error);
    }
  },

  /**
   * 5. 메모 삭제 (Delete)
   */
  async deleteNote(datetime: string, order?: number, rowIndex?: number) {
    if (!SCRIPT_URL) return;

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "delete",
          datetime,
          order,
          rowIndex,
        }),
      });
    } catch (error) {
      console.error("deleteNote 실패:", error);
    }
  },

  /**
   * 6. 드래그 앤 드롭 순서(order) 일괄 변경 (Reorder)
   */
  async reorderNotes(orders: { datetime: string; order: number }[]) {
    if (!SCRIPT_URL) return;

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "reorder",
          orders,
        }),
      });
    } catch (error) {
      console.error("reorderNotes 실패:", error);
    }
  },
};
