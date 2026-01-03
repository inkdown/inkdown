import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're running smoke tests
const isSmoke = process.env.TEST_TYPE === 'smoke';

export default defineConfig({
    plugins: [react()],
    test: {
        // Use jsdom for DOM testing
        environment: 'jsdom',
        
        // Environment options for jsdom
        environmentOptions: {
            jsdom: {
                // Include default HTML structure
                html: '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>',
                // Expose globals
                beforeParse(window: any) {
                    // IndexedDB will be set up by the setup file
                },
            },
        },
        
        // Global setup file - use different setup for smoke tests
        setupFiles: isSmoke 
            ? ['./test/smoke/setup.ts'] 
            : ['./test/unit/setup.ts'],
        
        // Include test files based on test type
        include: isSmoke
            ? ['test/smoke/**/*.smoke.test.ts', 'test/smoke/**/*.smoke.test.tsx']
            : [
                'test/unit/**/*.test.ts',
                'test/unit/**/*.test.tsx',
                'packages/*/test/**/*.test.ts',
                'packages/*/test/**/*.test.tsx',
            ],
        
        // Exclude node_modules and build artifacts
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/target/**',
        ],
        
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: [
                'packages/*/src/**/*.ts',
                'packages/*/src/**/*.tsx',
                'apps/*/src/**/*.ts',
                'apps/*/src/**/*.tsx',
            ],
            exclude: [
                '**/*.d.ts',
                '**/index.ts',
                '**/types/**',
            ],
            // Minimum coverage thresholds
            thresholds: {
                statements: 50,
                branches: 50,
                functions: 50,
                lines: 50,
            },
        },
        
        // Alias for cleaner imports
        alias: {
            '@inkdown/core': resolve(__dirname, './packages/core/src'),
            '@inkdown/ui': resolve(__dirname, './packages/ui/src'),
            '@inkdown/plugins': resolve(__dirname, './packages/plugins/src'),
            '@inkdown/native-tauri': resolve(__dirname, './packages/native-tauri/src'),
        },
        
        // Global test utilities
        globals: true,
        
        // Reporter for CI
        reporters: process.env.CI ? ['basic', 'json'] : ['verbose'],
        outputFile: {
            json: './test/results/test-results.json',
        },
        
        // Timeout for tests
        testTimeout: 10000,
        
        // Clear mocks between tests
        clearMocks: true,
        restoreMocks: true,
    },
    
    // Resolve configuration
    resolve: {
        alias: {
            '@inkdown/core': resolve(__dirname, './packages/core/src'),
            '@inkdown/ui': resolve(__dirname, './packages/ui/src'),
            '@inkdown/plugins': resolve(__dirname, './packages/plugins/src'),
            '@inkdown/native-tauri': resolve(__dirname, './packages/native-tauri/src'),
        },
    },
});
