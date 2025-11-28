// Color scheme type
export type ColorScheme = 'light' | 'dark';

// Theme manifest definition
export interface ThemeManifest {
    name: string;
    author: string;
    version: string;
    modes: ColorScheme[];
    builtIn?: boolean;
}

// Theme configuration
export interface ThemeConfig {
    id: string;
    name: string;
    author?: string;
    version?: string;
    modes: ColorScheme[];
    builtIn?: boolean;
}
