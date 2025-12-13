/**
 * IExport Interface
 *
 * Cross-platform export/import operations
 * This is the recommended API for plugins
 */

import type {
    ExportFeature,
    ExportOptions,
    ExportResult,
    ImportOptions,
    ImportResult,
} from '../types';

export interface IExport {
    /**
     * Export data to a file
     * - Desktop: Shows save dialog, saves to selected path
     * - Mobile: Opens share sheet
     *
     * @example
     * ```ts
     * const result = await app.export.saveFile({
     *   filename: 'document.pdf',
     *   data: pdfData,
     *   mimeType: 'application/pdf',
     * });
     * ```
     */
    saveFile(options: ExportOptions): Promise<ExportResult>;

    /**
     * Import a file
     * - Desktop: Shows open file dialog
     * - Mobile: Shows document picker
     *
     * @returns File data or null if cancelled
     */
    pickFile(options?: ImportOptions): Promise<ImportResult | null>;

    /**
     * Import multiple files
     * - Desktop: Shows open file dialog with multiple selection
     * - Mobile: Shows document picker with multiple selection
     *
     * @returns Array of file data (empty if cancelled)
     */
    pickFiles(options?: ImportOptions): Promise<ImportResult[]>;

    /**
     * Check if a feature is supported on this platform
     */
    supports(feature: ExportFeature): boolean;
}
