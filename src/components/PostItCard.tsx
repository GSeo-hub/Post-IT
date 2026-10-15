"use client";

import React, { useState } from "react";
import { PostItNote, Category, NoteState } from "@/types/note";
import { COLOR_CONFIG } from "@/lib/note-utils";
import { Trash2, Edit3, Check, X, GripVertical, CheckCircle2, Circle } from "lucide-react";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

interface PostItCardProps {
  note: PostItNote;
  onDelete: (id: string, datetime: string, order?: number, rowIndex?: number) => void;
  onEdit: (id: string, datetime: string, newContent: string, newCategory: Category, rowIndex?: number) => void;
  onToggleState: (note: PostItNote) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export const PostItCard: React.FC<PostItCardProps> = ({
  note,
  onDelete,
  onEdit,
  onToggleState,
  dragHandleProps,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editCategory, setEditCategory] = useState<Category>(note.category);

  const colorMeta = COLOR_CONFIG[note.color] || COLOR_CONFIG.yellow;
  const isCompleted = note.state === "완료";

  const handleSave = () => {
    if (editContent.trim()) {
      onEdit(note.id, note.datetime, editContent.trim(), editCategory, note.rowIndex);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setEditCategory(note.category);
    setIsEditing(false);
  };

  return (
    <div
      style={
        {
          "--note-rotation": `${note.rotation || 0}deg`,
        } as React.CSSProperties
      }
      className={`animate-stick group relative flex flex-col justify-between p-4 rounded-xs border transition-all duration-200 min-h-[220px] select-none ${
        colorMeta.bg
      } ${colorMeta.border} ${colorMeta.text} postit-shadow hover:scale-[1.02] hover:z-20 ${
        isCompleted ? "opacity-75 grayscale-[20%]" : ""
      }`}
    >
      {/* 상단 핀/테이프 느낌의 상단 바 */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3 rounded-b-sm opacity-50 ${colorMeta.strip}`}
      />

      {/* 헤더: 드래그 핸들, 완료 체크 버튼, 카테고리 뱃지 & 액션 버튼 */}
      <div className="flex items-center justify-between gap-1 mb-2.5 pt-1">
        <div className="flex items-center gap-1.5">
          {/* 드래그 핸들 */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 text-black/40 hover:text-black/80 rounded transition-colors touch-none"
            title="드래그하여 순서 변경"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* 완료 체크 버튼 (state 컬럼 연동) */}
          <button
            onClick={() => onToggleState(note)}
            className={`p-1 rounded-full transition-transform active:scale-90 ${
              isCompleted
                ? "text-emerald-700 bg-emerald-100/70"
                : "text-black/40 hover:text-black/70 hover:bg-black/5"
            }`}
            title={isCompleted ? "완료됨 (클릭하여 진행중으로 변경)" : "완료 체크하기"}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 fill-emerald-500/20 text-emerald-700" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>

          {/* 카테고리 뱃지 */}
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full shadow-xs ${colorMeta.badge}`}
          >
            {note.category}
          </span>
        </div>

        {/* 편집/삭제 액션 버튼 */}
        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 rounded bg-black/10 hover:bg-black/20 text-emerald-800 transition-colors"
                title="저장"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded bg-black/10 hover:bg-black/20 text-rose-800 transition-colors"
                title="취소"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded hover:bg-black/10 text-black/60 hover:text-black transition-colors"
                title="메모 수정"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(note.id, note.datetime, note.order, note.rowIndex)}
                className="p-1 rounded hover:bg-black/10 text-black/60 hover:text-red-700 transition-colors"
                title="메모 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 본문 영역 */}
      <div className="flex-1 my-1">
        {isEditing ? (
          <div className="flex flex-col gap-2 h-full">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full flex-1 p-2 bg-white/70 rounded text-sm text-zinc-900 border border-black/20 focus:outline-none focus:ring-1 focus:ring-black resize-none min-h-[90px]"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-black/70">분류:</span>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as Category)}
                className="text-xs p-1 bg-white/80 rounded border border-black/20 text-zinc-800 focus:outline-none"
              >
                <option value="할 일">할 일</option>
                <option value="아이디어">아이디어</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>
        ) : (
          <p
            className={`whitespace-pre-wrap break-words text-sm md:text-base font-medium leading-relaxed font-sans text-zinc-900 ${
              isCompleted ? "line-through text-zinc-600/80" : ""
            }`}
          >
            {note.content}
          </p>
        )}
      </div>

      {/* 왼쪽 하단: 연월일 시간 요일 표시 (작고 흐릿하게) & 상태 표시 */}
      <div className="pt-3 mt-auto border-t border-black/10 flex items-center justify-between">
        <span className="text-[11px] tracking-tight text-black/45 dark:text-black/55 font-mono select-none">
          {note.datetime}
        </span>
        {isCompleted && (
          <span className="text-[11px] font-bold text-emerald-800/80 bg-emerald-200/50 px-1.5 py-0.5 rounded">
            완료
          </span>
        )}
      </div>
    </div>
  );
};
