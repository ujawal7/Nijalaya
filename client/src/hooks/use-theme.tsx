import { createContext, useContext, useEffect, useState } from "react";
import { StorageService } from "@/lib/storage";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = StorageService.getItem<Theme>("theme");
    return stored || "system";
  });

  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    
    let newEffectiveTheme: "light" | "dark";
    
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      newEffectiveTheme = prefersDark ? "dark" : "light";
    } else {
      newEffectiveTheme = theme;
    }
    
    // Apply the effective theme
    root.classList.add(newEffectiveTheme);
    setEffectiveTheme(newEffectiveTheme);
    
    // Update theme-color meta tag for PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", newEffectiveTheme === "dark" ? "#1e293b" : "#6366f1");
    }
    
    // Store theme preference
    StorageService.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const newEffectiveTheme = e.matches ? "dark" : "light";
        setEffectiveTheme(newEffectiveTheme);
        
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newEffectiveTheme);
        
        // Update theme-color meta tag
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute("content", newEffectiveTheme === "dark" ? "#1e293b" : "#6366f1");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      effectiveTheme,
      setTheme: handleSetTheme,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
