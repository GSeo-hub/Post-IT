"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // 기본 라이트 모드 또는 사용자 저장 설정 불러오기
    const saved = localStorage.getItem("postit-theme") as "light" | "dark" | null;
    const initialTheme = saved || "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("postit-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 p-2 rounded-xl bg-muted/60 border border-border text-foreground hover:bg-muted transition-colors shadow-xs"
      title={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
      aria-label="테마 전환"
    >
      {theme === "light" ? (
        <>
          <Moon className="w-4 h-4 text-zinc-700" />
          <span className="text-xs font-medium hidden sm:inline">다크 모드</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium hidden sm:inline">라이트 모드</span>
        </>
      )}
    </button>
  );
};
