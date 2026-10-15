import { PostItColor } from "@/types/note";

export const COLOR_CONFIG: Record<
  PostItColor,
  {
    bg: string;
    border: string;
    badge: string;
    text: string;
    strip: string;
    name: string;
    numberCode: number;
  }
> = {
  yellow: {
    bg: "bg-[#fff7a0] dark:bg-[#eab308]/90",
    border: "border-yellow-300 dark:border-yellow-600",
    badge: "bg-yellow-200/80 text-yellow-900 dark:bg-yellow-900/60 dark:text-yellow-100",
    text: "text-zinc-800 dark:text-zinc-900",
    strip: "bg-yellow-300/60 dark:bg-yellow-400/50",
    name: "노란색",
    numberCode: 1,
  },
  pink: {
    bg: "bg-[#ffc6d9] dark:bg-[#f43f5e]/85",
    border: "border-pink-300 dark:border-pink-600",
    badge: "bg-pink-200/80 text-pink-900 dark:bg-pink-950/60 dark:text-pink-100",
    text: "text-zinc-800 dark:text-zinc-900",
    strip: "bg-pink-300/60 dark:bg-pink-400/50",
    name: "분홍색",
    numberCode: 2,
  },
  green: {
    bg: "bg-[#bbf7d0] dark:bg-[#22c55e]/85",
    border: "border-emerald-300 dark:border-emerald-600",
    badge: "bg-emerald-200/80 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100",
    text: "text-zinc-800 dark:text-zinc-900",
    strip: "bg-emerald-300/60 dark:bg-emerald-400/50",
    name: "초록색",
    numberCode: 3,
  },
  blue: {
    bg: "bg-[#bae6fd] dark:bg-[#38bdf8]/85",
    border: "border-sky-300 dark:border-sky-600",
    badge: "bg-sky-200/80 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100",
    text: "text-zinc-800 dark:text-zinc-900",
    strip: "bg-sky-300/60 dark:bg-sky-400/50",
    name: "파랑색",
    numberCode: 4,
  },
};

export const getColorFromCode = (code: number | string): PostItColor => {
  const num = Number(code);
  switch (num) {
    case 1:
      return "yellow";
    case 2:
      return "pink";
    case 3:
      return "green";
    case 4:
      return "blue";
    default:
      return "yellow";
  }
};

export const getRandomColor = (): PostItColor => {
  const colors: PostItColor[] = ["yellow", "pink", "green", "blue"];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const formatKoreanDate = (date: Date = new Date()): string => {
  const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = days[date.getDay()];
  
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${year}년 ${month}월 ${day}일 ${dayName} ${hours}:${minutes}`;
};
