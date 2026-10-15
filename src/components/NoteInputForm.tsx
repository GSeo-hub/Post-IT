"use client";

import React, { useState } from "react";
import { Category } from "@/types/note";
import { PlusCircle } from "lucide-react";

interface NoteInputFormProps {
  onAddNote: (content: string, category: Category) => void;
}

export const NoteInputForm: React.FC<NoteInputFormProps> = ({ onAddNote }) => {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("할 일");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddNote(content.trim(), category);
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-10 bg-card border border-border shadow-md rounded-2xl p-4 sm:p-5 transition-all">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메모할 내용을 입력하세요... (Ctrl+Enter로 바로 등록)"
          rows={3}
          className="w-full resize-none rounded-xl bg-muted/40 p-3.5 text-sm sm:text-base border border-input focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition-all"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* 카테고리 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              카테고리:
            </span>
            <div className="inline-flex rounded-lg p-1 bg-muted/50 border border-border">
              {(["할 일", "아이디어", "기타"] as Category[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all ${
                    category === cat
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 등록 버튼 */}
          <button
            type="submit"
            disabled={!content.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>포스트잇 붙이기</span>
          </button>
        </div>
      </form>
    </div>
  );
};
