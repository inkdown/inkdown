type ThemeColors =
  "gruvbox-dark"
  | "dracula-dark"
  | "solarized-dark"
  | "default-light"
  | "default-dark"
  | "solarized-light"
  | "dracula-light"
  
type ThemeMode = 'dark' | 'light' | 'system';

export type Theme = {
  mode: ThemeMode;
  color: ThemeColors;
};

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};
