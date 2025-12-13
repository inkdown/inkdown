import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],

    // Vite options tailored for Tauri development
    clearScreen: false,

    // Tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        watch: {
            // Ignore changes in src-tauri (Rust code)
            ignored: ['**/src-tauri/**'],
        },
    },

    // Set the root to the apps/desktop directory
    root: '.',

    // Build output configuration
    build: {
        // Tauri uses Chromium on Windows and WebKit on macOS and Linux
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: false,
        outDir: 'dist',
    },

    // Environment variables
    envPrefix: [
        'VITE_',
        'TAURI_PLATFORM',
        'TAURI_ARCH',
        'TAURI_FAMILY',
        'TAURI_PLATFORM_VERSION',
        'TAURI_PLATFORM_TYPE',
        'TAURI_DEBUG',
    ],
});
