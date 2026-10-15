"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PostItNote, Category, NoteState } from "@/types/note";
import { getRandomColor, formatKoreanDate, COLOR_CONFIG } from "@/lib/note-utils";
import { googleSheetService } from "@/lib/google-sheet-service";
import { NoteInputForm } from "@/components/NoteInputForm";
import { PostItCard } from "@/components/PostItCard";
import { CategoryFilter, FilterCategory } from "@/components/CategoryFilter";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { StickyNote, Sparkles, Inbox, RefreshCw, CloudCheck, AlertCircle } from "lucide-react";

export default function Home() {
  const [notes, setNotes] = useState<PostItNote[]>([]);
  const [filter, setFilter] = useState<FilterCategory>("전체");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasGoogleUrl, setHasGoogleUrl] = useState(true);

  // 구글 시트에서 최신 메모 불러오기
  const loadNotesFromGoogle = async () => {
    setIsLoading(true);
    try {
      const fetched = await googleSheetService.fetchNotes();
      if (fetched && fetched.length > 0) {
        setNotes(fetched);
        localStorage.setItem("postit_notes_v1", JSON.stringify(fetched));
      } else {
        // 시트에 데이터가 없으면 로컬 스토리지 확인
        const local = localStorage.getItem("postit_notes_v1");
        if (local) setNotes(JSON.parse(local));
      }
    } catch (err) {
      console.warn("구글 시트 연동 실패, 로컬 데이터를 사용합니다:", err);
      const local = localStorage.getItem("postit_notes_v1");
      if (local) {
        try {
          setNotes(JSON.parse(local));
        } catch {
          setNotes([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 마운트 시 실행
  useEffect(() => {
    setIsMounted(true);
    const googleUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
    setHasGoogleUrl(Boolean(googleUrl));

    // 먼저 로컬 캐시를 빠르게 보여준 뒤 구글 시트와 동기화
    const cached = localStorage.getItem("postit_notes_v1");
    if (cached) {
      try {
        setNotes(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }

    if (googleUrl) {
      loadNotesFromGoogle();
    }
  }, []);

  // 로컬 스토리지 백업 저장
  useEffect(() => {
    if (isMounted && notes.length > 0) {
      localStorage.setItem("postit_notes_v1", JSON.stringify(notes));
    }
  }, [notes, isMounted]);

  // 1. 메모 추가 (Create)
  const handleAddNote = async (content: string, category: Category) => {
    const randomRotation = Number((Math.random() * 5 - 2.5).toFixed(1));
    const randomColor = getRandomColor();
    const colorCode = COLOR_CONFIG[randomColor].numberCode;
    const datetimeStr = formatKoreanDate(new Date());
    const nextOrder = notes.length > 0 ? Math.max(...notes.map((n) => n.order || 0)) + 1 : 1;

    const newNote: PostItNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      datetime: datetimeStr,
      category,
      content,
      color: randomColor,
      colorCode: colorCode,
      state: "진행중",
      order: nextOrder,
      rotation: randomRotation,
    };

    // UI 즉시 반영 (낙관적 업데이트)
    setNotes((prev) => [newNote, ...prev]);

    // 구글 시트 전송
    setIsSyncing(true);
    await googleSheetService.createNote({
      datetime: newNote.datetime,
      category: newNote.category,
      content: newNote.content,
      color: colorCode,
      state: "진행중",
      order: nextOrder,
    });
    setIsSyncing(false);
  };

  // 2. 메모 삭제 (Delete - 고유 ID 기준 즉시 제거 및 구글 시트 동기화)
  const handleDeleteNote = async (id: string, datetime: string, order?: number, rowIndex?: number) => {
    // 1) UI에서 즉시 메모 제거
    setNotes((prev) => prev.filter((n) => n.id !== id));

    // 2) 구글 시트에 삭제 요청
    setIsSyncing(true);
    await googleSheetService.deleteNote(datetime, order, rowIndex);
    setIsSyncing(false);
  };

  // 3. 메모 수정 (Update - 고유 ID 기준 내용 수정 및 구글 시트 동기화)
  const handleEditNote = async (
    id: string,
    datetime: string,
    newContent: string,
    newCategory: Category,
    rowIndex?: number
  ) => {
    // 1) UI에서 즉시 내용 수정
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, content: newContent, category: newCategory }
          : n
      )
    );

    // 2) 구글 시트에 수정 요청
    setIsSyncing(true);
    await googleSheetService.updateNote({
      datetime,
      content: newContent,
      category: newCategory,
      rowIndex,
    });
    setIsSyncing(false);
  };

  // 4. 완료 체크 상태 토글 (Toggle State - 대응하는 포스트잇만 정확히 1:1 토글)
  const handleToggleState = async (targetNote: PostItNote) => {
    const nextState: NoteState = targetNote.state === "완료" ? "진행중" : "완료";

    setNotes((prev) =>
      prev.map((n) =>
        n.id === targetNote.id
          ? { ...n, state: nextState }
          : n
      )
    );

    setIsSyncing(true);
    await googleSheetService.toggleNoteState(
      targetNote.datetime,
      nextState,
      targetNote.order,
      targetNote.rowIndex
    );
    setIsSyncing(false);
  };

  // 5. 드래그 앤 드롭 정렬 핸들러 (Reorder)
  const handleOnDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    if (sourceIndex === destIndex) return;

    let updatedList: PostItNote[] = [];

    if (filter === "전체") {
      updatedList = Array.from(notes);
      const [reorderedItem] = updatedList.splice(sourceIndex, 1);
      updatedList.splice(destIndex, 0, reorderedItem);
    } else {
      const filteredNotes = notes.filter((n) => n.category === filter);
      const itemToMove = filteredNotes[sourceIndex];
      const targetItem = filteredNotes[destIndex];

      if (!itemToMove || !targetItem) return;

      const originalSourceIdx = notes.findIndex((n) => n.id === itemToMove.id);
      const originalDestIdx = notes.findIndex((n) => n.id === targetItem.id);

      updatedList = Array.from(notes);
      const [reorderedItem] = updatedList.splice(originalSourceIdx, 1);
      updatedList.splice(originalDestIdx, 0, reorderedItem);
    }

    // 순서 번호(order) 재할당
    const reorderedWithOrder = updatedList.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setNotes(reorderedWithOrder);

    // 구글 시트 일괄 순서 변경 호출
    setIsSyncing(true);
    await googleSheetService.reorderNotes(
      reorderedWithOrder.map((n) => ({
        datetime: n.datetime,
        order: n.order,
      }))
    );
    setIsSyncing(false);
  };

  // 카테고리별 갯수 집계
  const counts = useMemo(() => {
    return {
      전체: notes.length,
      "할 일": notes.filter((n) => n.category === "할 일").length,
      아이디어: notes.filter((n) => n.category === "아이디어").length,
      기타: notes.filter((n) => n.category === "기타").length,
    };
  }, [notes]);

  // 필터링된 메모 목록 (order 기준)
  const displayedNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (filter === "전체") return sorted;
    return sorted.filter((n) => n.category === filter);
  }, [notes, filter]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <StickyNote className="w-5 h-5 animate-bounce" />
          <span>포스트잇 보드 준비 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial from-background to-muted/20 pb-24">
      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 dark:bg-amber-500 flex items-center justify-center shadow-xs text-amber-950">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
                포스트잇 Todo
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 구글 시트 동기화 상태 및 새로고침 버튼 */}
            {hasGoogleUrl && (
              <button
                onClick={loadNotesFromGoogle}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-all disabled:opacity-50"
                title="구글 시트와 동기화 새로고침"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-500" : ""}`}
                />
                <span className="hidden md:inline">
                  {isLoading ? "동기화 중..." : isSyncing ? "시트 저장 중..." : "시트 동기화"}
                </span>
              </button>
            )}

            <CategoryFilter
              currentFilter={filter}
              onFilterChange={setFilter}
              counts={counts}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 메인 영역 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* 구글 시트 연동 배너 알림 */}
        {!hasGoogleUrl && (
          <div className="max-w-xl mx-auto mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>.env.local에 구글 앱스 스크립트 URL이 설정되지 않아 로컬 모드로 작동합니다.</span>
          </div>
        )}

        {/* 가운데 메모 입력 폼 */}
        <NoteInputForm onAddNote={handleAddNote} />

        {/* 보드 영역 타이틀 & 안내 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <span>나의 포스트잇 보드</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-normal text-muted-foreground">
                {displayedNotes.length}개
              </span>
            </h2>
            {isSyncing && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                시트 반영 중
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            💡 왼쪽 핸들을 잡아 드래그하면 시트의 순서(order)가 실시간으로 갱신됩니다.
          </p>
        </div>

        {/* 빈 화면 안내 */}
        {displayedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-border rounded-2xl bg-card/40 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground/60 mb-3" />
            <p className="text-base font-medium text-foreground">
              {filter === "전체"
                ? "등록된 포스트잇이 없습니다."
                : `'${filter}' 카테고리에 메모가 없습니다.`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              상단 입력창에서 새로운 메모를 작성하고 붙여보세요!
            </p>
          </div>
        ) : (
          /* 한 행에 최대 4개 배치되는 반응형 그리드 */
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="postit-board" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start"
                >
                  {displayedNotes.map((note, index) => {
                    const uniqueKey = note.id ? `${note.id}-${index}` : `note-${note.datetime || index}-${index}`;
                    return (
                      <Draggable
                        key={uniqueKey}
                        draggableId={uniqueKey}
                        index={index}
                      >
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`transition-shadow ${
                            dragSnapshot.isDragging
                              ? "scale-105 z-50 shadow-2xl opacity-90 ring-2 ring-primary/40 rounded-xs"
                              : ""
                          }`}
                        >
                          <PostItCard
                            note={note}
                            onDelete={handleDeleteNote}
                            onEdit={handleEditNote}
                            onToggleState={handleToggleState}
                            dragHandleProps={dragProvided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </main>

      {/* Footer 영역 */}
      <footer className="mt-20 border-t border-border/70 py-6 text-center text-xs text-muted-foreground/80 font-medium">
        <p>Copyright INU Post-it Todo List by Seogyun Yim</p>
      </footer>
    </div>
  );
}
