/**
 * TauriFont
 *
 * Tauri implementation of IFont
 */

import type { IFont } from '@inkdown/core/native';
import { invoke } from '@tauri-apps/api/core';

export class TauriFont implements IFont {
    private cachedFonts: string[] | null = null;

    async listSystemFonts(): Promise<string[]> {
        if (this.cachedFonts) {
            return this.cachedFonts;
        }

        this.cachedFonts = await invoke<string[]>('list_system_fonts');
        return this.cachedFonts;
    }

    async fontExists(fontName: string): Promise<boolean> {
        const fonts = await this.listSystemFonts();
        return fonts.some((f) => f.toLowerCase() === fontName.toLowerCase());
    }
}
