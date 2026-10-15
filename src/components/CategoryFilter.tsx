"use client";

import React from "react";
import { Category } from "@/types/note";
import { Filter } from "lucide-react";

export type FilterCategory = "전체" | Category;

interface CategoryFilterProps {
  currentFilter: FilterCategory;
  onFilterChange: (category: FilterCategory) => void;
  counts: Record<FilterCategory, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  currentFilter,
  onFilterChange,
  counts,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex items-center">
        <Filter className="w-4 h-4 absolute left-3 pointer-events-none text-muted-foreground" />
        <select
          value={currentFilter}
          onChange={(e) => onFilterChange(e.target.value as FilterCategory)}
          className="appearance-none pl-9 pr-8 py-2 bg-card border border-border text-foreground text-sm font-medium rounded-xl shadow-xs hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
        >
          <option value="전체">전체 보기 ({counts["전체"]})</option>
          <option value="할 일">할 일 ({counts["할 일"]})</option>
          <option value="아이디어">아이디어 ({counts["아이디어"]})</option>
          <option value="기타">기타 ({counts["기타"]})</option>
        </select>
        <div className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
          ▼
        </div>
      </div>
    </div>
  );
};
