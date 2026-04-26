"use client";

import { useEffect, useState } from "react";
import { theme } from "@/styles/theme";

export type ThemeMode = keyof typeof theme.modes;

const THEME_STORAGE_KEY = "logflow-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  root.setAttribute("data-theme", mode);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const saved = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    return saved && saved in theme.modes ? saved : "light";
  });

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextMode = (event.newValue as ThemeMode | null) ?? "light";
      if (nextMode in theme.modes) {
        setMode(nextMode);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = (nextMode: ThemeMode) => {
    setMode(nextMode);
    applyTheme(nextMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
  };

  const toggleTheme = () => {
    setTheme(mode === "light" ? "dark" : "light");
  };

  return {
    mode,
    setTheme,
    toggleTheme,
    isDark: mode === "dark",
  };
}
