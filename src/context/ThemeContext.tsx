import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [darkMode, setDarkModeState] = useState(() => {
    // Check localStorage first for immediate load
    const stored = localStorage.getItem("fableforge_dark_mode");
    if (stored !== null) {
      return stored === "true";
    }
    // Check system preference as fallback
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Sync with user metadata when user logs in
  useEffect(() => {
    if (user?.user_metadata?.dark_mode !== undefined) {
      setDarkModeState(user.user_metadata.dark_mode);
      localStorage.setItem(
        "fableforge_dark_mode",
        String(user.user_metadata.dark_mode)
      );
    }
  }, [user?.user_metadata?.dark_mode]);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("fableforge_dark_mode", String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkModeState((prev) => !prev);
  };

  const setDarkMode = (value: boolean) => {
    setDarkModeState(value);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
