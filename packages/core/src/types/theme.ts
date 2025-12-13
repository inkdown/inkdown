// Color scheme type
export type ColorScheme = 'light' | 'dark';

// Theme manifest definition (manifest.json structure)
export interface ThemeManifest {
    name: string;
    author: string;
    version: string;
    description?: string;
    homepage?: string;
    modes: ColorScheme[];
}

// Theme configuration (runtime representation)
export interface ThemeConfig {
    id: string;
    name: string;
    author?: string;
    version?: string;
    description?: string;
    homepage?: string;
    modes: ColorScheme[];
    builtIn?: boolean;
}
