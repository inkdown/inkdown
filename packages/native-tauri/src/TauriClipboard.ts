/**
 * TauriClipboard
 *
 * Tauri implementation of IClipboard
 */

import type { IClipboard } from '@inkdown/core/native';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';

export class TauriClipboard implements IClipboard {
    async writeText(text: string): Promise<void> {
        await writeText(text);
    }

    async readText(): Promise<string> {
        const text = await readText();
        return text ?? '';
    }

    // Image clipboard not implemented for now
    writeImage = undefined;
    readImage = undefined;
}
