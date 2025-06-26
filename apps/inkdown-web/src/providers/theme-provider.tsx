import { createContext, useContext, useEffect, useState } from "react";

export type Theme =
  | "system"
  | "light"
  | "dark"
  | "gruvbox-dark"
  | "dracula"
  | "solarized-dark"
  | "nord"
  | "one-dark";

const ALL_THEMES: Theme[] = [
  "light",
  "dark",
  "gruvbox-dark",
  "dracula",
  "solarized-dark",
  "nord",
  "one-dark",
];

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext =
  createContext<ThemeProviderState>({ theme: "system", setTheme: () => {} });

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, _setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = document.documentElement;

    ALL_THEMES.forEach((t) => root.classList.remove(`theme-${t}`));
    root.classList.remove("light", "dark");

    let finalTheme = theme;
    if (theme === "system") {
      finalTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
		
    if (finalTheme === "light" || finalTheme === "dark") {
      root.classList.add(finalTheme);
    } else {
      root.classList.add(`theme-${finalTheme}`);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    _setTheme(newTheme);
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeProviderContext);
  if (!ctx) throw new Error("useTheme dentro de ThemeProvider");
  return ctx;
};
