/**
 * IFont Interface
 *
 * Font operations - OPTIONAL (limited on mobile)
 */

export interface IFont {
    /**
     * List all system fonts
     * @platform desktop
     */
    listSystemFonts(): Promise<string[]>;

    /**
     * Check if a font is available
     */
    fontExists?(fontName: string): Promise<boolean>;
}
