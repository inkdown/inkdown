import { native } from '../native';
import { createLogger } from '../utils/logger';

/**
 * FontManager - Manages system fonts
 * Provides access to system fonts via native platform
 */
export class FontManager {
    private availableFonts: string[] = [];
    private fontsLoaded = false;
    private logger = createLogger('FontManager');

    /**
     * Load system fonts from the native platform
     * Returns cached fonts if already loaded
     */
    async loadSystemFonts(): Promise<string[]> {
        if (this.fontsLoaded) {
            this.logger.debug('Returning cached fonts');
            return this.availableFonts;
        }

        // Check if font module is available
        if (!native.supportsModule('font')) {
            this.logger.info('Font module not available, using fallback fonts');
            this.availableFonts = this.getFallbackFonts();
            this.fontsLoaded = true;
            return this.availableFonts;
        }

        try {
            this.logger.info('Loading system fonts...');
            const fonts = (await native.font?.listSystemFonts()) || [];
            this.availableFonts = fonts;
            this.fontsLoaded = true;
            this.logger.info(`Loaded ${fonts.length} system fonts`);
            return fonts;
        } catch (error: any) {
            this.logger.error('Failed to load system fonts, using fallback', error);
            // Fallback to common fonts if native command fails
            this.availableFonts = this.getFallbackFonts();
            this.fontsLoaded = true;
            return this.availableFonts;
        }
    }

    /**
     * Get cached fonts without reloading
     * Returns empty array if fonts haven't been loaded yet
     */
    getCachedFonts(): string[] {
        return this.availableFonts;
    }

    /**
     * Check if a specific font family is available
     */
    isFontAvailable(fontFamily: string): boolean {
        return this.availableFonts.includes(fontFamily);
    }

    /**
     * Get fallback font list for when Tauri is not available
     */
    private getFallbackFonts(): string[] {
        return [
            'Arial',
            'Arial Black',
            'Cascadia Code',
            'Comic Sans MS',
            'Consolas',
            'Courier New',
            'Fira Code',
            'Georgia',
            'Helvetica',
            'Impact',
            'JetBrains Mono',
            'Lucida Console',
            'Lucida Sans',
            'Monaco',
            'Palatino',
            'Roboto',
            'Segoe UI',
            'SF Pro',
            'Source Code Pro',
            'System UI',
            'Tahoma',
            'Times New Roman',
            'Trebuchet MS',
            'Ubuntu Mono',
            'Verdana',
        ];
    }
}
