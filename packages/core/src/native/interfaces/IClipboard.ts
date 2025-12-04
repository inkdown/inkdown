/**
 * IClipboard Interface
 * 
 * Clipboard operations - OPTIONAL
 */

export interface IClipboard {
  /**
   * Write text to clipboard
   */
  writeText(text: string): Promise<void>;
  
  /**
   * Read text from clipboard
   */
  readText(): Promise<string>;
  
  /**
   * Write image to clipboard (not supported on all platforms)
   */
  writeImage?(data: Uint8Array): Promise<void>;
  
  /**
   * Read image from clipboard (not supported on all platforms)
   */
  readImage?(): Promise<Uint8Array | null>;
}
