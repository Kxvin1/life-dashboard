"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Initialize with a function to avoid the state being set to 'dark' on every render
  const [theme, setTheme] = useState<Theme>("dark"); // Always default to dark initially
  const [isInitialized, setIsInitialized] = useState(false);

  // First effect: Initialize theme from localStorage on client-side
  useEffect(() => {
    // We can't access localStorage during SSR, so we need to check if window is defined
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme") as Theme | null;

      // If there's a stored theme, use it
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        // No stored theme, set to dark mode as default
        setTheme("dark");
        localStorage.setItem("theme", "dark");
      }

      // Mark as initialized
      setIsInitialized(true);
    }
  }, []);

  // Second effect: Apply theme to document when theme changes or on initialization
  useEffect(() => {
    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Only store in localStorage if we're initialized (client-side)
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
