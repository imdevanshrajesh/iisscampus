"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type ManageTheme = "light" | "dark";

type ManageThemeContextType = {
  theme: ManageTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ManageTheme) => void;
};

const ManageThemeContext = createContext<ManageThemeContextType | null>(null);

const STORAGE_KEY = "iiss_manage_theme";

export function ManageThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ManageTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ManageTheme | null;
      if (saved === "dark" || saved === "light") {
        setThemeState(saved);
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        // Optional default if user prefers dark mode
        setThemeState("dark");
      }
    } catch {
      // Storage unavailable
    }
    setMounted(true);
  }, []);

  const setTheme = (nextTheme: ManageTheme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
      document.cookie = `${STORAGE_KEY}=${nextTheme}; path=/manage; max-age=31536000; SameSite=Lax`;
    } catch {
      // Storage unavailable
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  // When inside manage portal, apply dark class to document body / html, and cleanup when unmounting
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add("manage-dark-mode");
      body.classList.add("manage-dark-body");
    } else {
      root.classList.remove("manage-dark-mode");
      body.classList.remove("manage-dark-body");
    }

    return () => {
      root.classList.remove("manage-dark-mode");
      body.classList.remove("manage-dark-body");
    };
  }, [isDark, mounted]);

  return (
    <ManageThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      <div
        id="manage-shell"
        data-theme={theme}
        className={`min-h-dvh transition-colors duration-150 ${
          isDark
            ? "manage-dark dark bg-black text-white"
            : "manage-light bg-[#eef1f4] text-ink"
        }`}
      >
        {children}
      </div>
    </ManageThemeContext.Provider>
  );
}

export function useManageTheme() {
  const context = useContext(ManageThemeContext);
  if (!context) {
    return {
      theme: "light" as ManageTheme,
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}

export function ManageThemeToggle({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "sidebar" | "compact" | "badge";
  className?: string;
}) {
  const { theme, isDark, toggleTheme } = useManageTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl border border-transparent p-2 text-muted opacity-50 ${className}`}
        aria-hidden="true"
      >
        <Moon className="h-4 w-4" />
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
          isDark
            ? "bg-black text-amber-300 hover:bg-zinc-900 border border-zinc-800"
            : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white border border-white/10"
        } ${className}`}
      >
        <span className="flex items-center gap-2">
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-4 w-4 text-sky-300 group-hover:-rotate-12 transition-transform" />
          )}
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isDark ? "bg-amber-400/20 text-amber-300" : "bg-white/15 text-white/90"
          }`}
        >
          {isDark ? "Dark" : "Light"}
        </span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
          isDark
            ? "border-zinc-800 bg-black text-amber-300 hover:bg-zinc-900"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs"
        } ${className}`}
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
        isDark
          ? "border-zinc-800 bg-black text-amber-300 hover:bg-zinc-900"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-xs"
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-slate-700" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}
