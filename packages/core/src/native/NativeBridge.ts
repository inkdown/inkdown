/**
 * NativeBridge
 * 
 * Singleton for accessing platform-specific native implementations.
 * Supports modular registration for flexibility and testability.
 * 
 * @example
 * ```ts
 * // Register all modules at once (app boot)
 * import { registerTauriAdapters } from '@inkdown/native-tauri';
 * registerTauriAdapters();
 * 
 * // Or register individual modules
 * native.registerModule('fs', new MockFileSystem());
 * 
 * // Use in code
 * const content = await native.fs.readFile('/path/to/file');
 * ```
 */

import type { IFileSystem } from './interfaces/IFileSystem';
import type { IConfig } from './interfaces/IConfig';
import type { IDialog } from './interfaces/IDialog';
import type { IClipboard } from './interfaces/IClipboard';
import type { IPlatform } from './interfaces/IPlatform';
import type { IExport } from './interfaces/IExport';
import type { IFont } from './interfaces/IFont';
import type { PlatformFeature } from './types';

// ============================================================================
// Module Types
// ============================================================================

export interface NativeModules {
  fs: IFileSystem;
  config: IConfig;
  platform: IPlatform;
  export: IExport;
  dialog?: IDialog;
  clipboard?: IClipboard;
  font?: IFont;
}

type ModuleName = keyof NativeModules;
type RequiredModules = 'fs' | 'config' | 'platform' | 'export';

// ============================================================================
// NativeBridge Class
// ============================================================================

class NativeBridge {
  private static instance: NativeBridge;
  private modules: Partial<NativeModules> = {};
  private initialized = false;

  private constructor() {}

  static getInstance(): NativeBridge {
    if (!NativeBridge.instance) {
      NativeBridge.instance = new NativeBridge();
    }
    return NativeBridge.instance;
  }

  // ============================================================================
  // Registration
  // ============================================================================

  /**
   * Register all modules at once
   */
  registerAll(modules: NativeModules): void {
    this.modules = { ...modules };
    this.initialized = true;
    console.log('[NativeBridge] All modules registered');
  }

  /**
   * Register a specific module (allows hot-swap and mocking)
   */
  registerModule<K extends ModuleName>(name: K, implementation: NativeModules[K]): void {
    this.modules[name] = implementation;
    console.log(`[NativeBridge] Module '${name}' registered`);
    
    // Check if all required modules are registered
    this.checkInitialized();
  }

  /**
   * Check if a module is registered
   */
  hasModule(name: ModuleName): boolean {
    return name in this.modules && this.modules[name] !== undefined;
  }

  /**
   * Check if NativeBridge is fully initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  private checkInitialized(): void {
    const required: RequiredModules[] = ['fs', 'config', 'platform', 'export'];
    const allRegistered = required.every(name => this.hasModule(name));
    this.initialized = allRegistered;
  }

  // ============================================================================
  // Module Getters (Required)
  // ============================================================================

  get fs(): IFileSystem {
    return this.getRequired('fs');
  }

  get config(): IConfig {
    return this.getRequired('config');
  }

  get platform(): IPlatform {
    return this.getRequired('platform');
  }

  get export(): IExport {
    return this.getRequired('export');
  }

  // ============================================================================
  // Module Getters (Optional)
  // ============================================================================

  get dialog(): IDialog | undefined {
    return this.modules.dialog;
  }

  get clipboard(): IClipboard | undefined {
    return this.modules.clipboard;
  }

  get font(): IFont | undefined {
    return this.modules.font;
  }

  // ============================================================================
  // Feature Detection
  // ============================================================================

  /**
   * Check if an optional module is available
   */
  supportsModule(module: 'dialog' | 'clipboard' | 'font'): boolean {
    return this.hasModule(module);
  }

  /**
   * Check if a platform feature is supported
   */
  supports(feature: PlatformFeature): boolean {
    if (!this.initialized) return false;

    switch (feature) {
      case 'nativeDialog':
        return !!this.dialog?.showSaveDialog;
      case 'absolutePaths':
        return this.platform.info.type === 'desktop';
      case 'shareSheet':
        return this.platform.info.type === 'mobile';
      case 'systemFonts':
        return !!this.font?.listSystemFonts;
      case 'windowControls':
        return !!this.platform.window;
      case 'fileSystemAccess':
        return this.platform.info.type === 'desktop';
      default:
        return false;
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private getRequired<K extends ModuleName>(name: K): NonNullable<NativeModules[K]> {
    const module = this.modules[name];
    if (!module) {
      throw new Error(
        `[NativeBridge] Module '${name}' not registered. ` +
        `Make sure to call native.registerModule('${name}', implementation) or native.registerAll() first.`
      );
    }
    return module as NonNullable<NativeModules[K]>;
  }

  /**
   * Reset all modules (for testing)
   */
  reset(): void {
    this.modules = {};
    this.initialized = false;
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const native = NativeBridge.getInstance();
