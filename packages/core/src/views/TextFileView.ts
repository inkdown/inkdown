import type { TFile } from '../managers/Workspace';
import { ItemView } from './ItemView';

/**
 * Base class for views that display a file
 */
export abstract class TextFileView extends ItemView {
    file: TFile | null = null;

    /**
     * Load a file into the view
     */
    async setFile(file: TFile): Promise<void> {
        this.file = file;
        await this.onLoadFile(file);
    }

    /**
     * Called when a file is loaded
     */
    abstract onLoadFile(file: TFile): Promise<void>;

    /**
     * Called when the file is unloaded
     */
    abstract onUnloadFile(file: TFile): Promise<void>;

    /**
     * Save the current file
     */
    abstract save(): Promise<void>;

    /**
     * Get the current file content
     */
    abstract getViewData(): string;

    /**
     * Set the view content
     */
    abstract setViewData(data: string, clear: boolean): void;

    /**
     * Clear the view
     */
    abstract clear(): void;
}
