"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Read from localStorage or system preference
    const stored = localStorage.getItem("archit_theme") as Theme | null;
    const preferred: Theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    apply(preferred);
    setTheme(preferred);
  }, []);

  const apply = (t: Theme) => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    apply(next);
    localStorage.setItem("archit_theme", next);
    setTheme(next);
  };

  return { theme, toggle };
}
