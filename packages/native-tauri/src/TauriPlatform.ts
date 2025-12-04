/**
 * TauriPlatform
 * 
 * Tauri implementation of IPlatform (Window + Shell + Process)
 */

import { getCurrentWindow } from '@tauri-apps/api/window';
import { openUrl, revealItemInDir } from '@tauri-apps/plugin-opener';
import { exit } from '@tauri-apps/plugin-process';
import type { IPlatform, IWindowControls, IShell, IProcessControl, PlatformInfo } from '@inkdown/core/native';

// ============================================================================
// Window Controls
// ============================================================================

class TauriWindowControls implements IWindowControls {
  private window = getCurrentWindow();

  async minimize(): Promise<void> {
    await this.window.minimize();
  }

  async maximize(): Promise<void> {
    await this.window.maximize();
  }

  async toggleMaximize(): Promise<void> {
    await this.window.toggleMaximize();
  }

  async close(): Promise<void> {
    await this.window.close();
  }

  async isMaximized(): Promise<boolean> {
    return this.window.isMaximized();
  }

  async setTitle(title: string): Promise<void> {
    await this.window.setTitle(title);
  }

  onFocusChanged(callback: (focused: boolean) => void): () => void {
    let unlisten: (() => void) | null = null;

    this.window.onFocusChanged(({ payload: focused }) => {
      callback(focused);
    }).then(fn => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }
}

// ============================================================================
// Shell
// ============================================================================

class TauriShell implements IShell {
  async openUrl(url: string): Promise<void> {
    await openUrl(url);
  }

  async openPath(path: string): Promise<void> {
    await openUrl(path);
  }

  async showInFolder(path: string): Promise<void> {
    await revealItemInDir(path);
  }
}

// ============================================================================
// Process Control
// ============================================================================

class TauriProcessControl implements IProcessControl {
  exit(code = 0): void {
    exit(code);
  }

  async restart(): Promise<void> {
    // Tauri doesn't have a built-in restart, we exit and rely on external restart
    exit(0);
  }
}

// ============================================================================
// Platform
// ============================================================================

function detectOS(): PlatformInfo['os'] {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('win')) return 'windows';
  if (platform.includes('mac')) return 'macos';
  if (platform.includes('linux')) return 'linux';
  return 'linux'; // Default fallback
}

export class TauriPlatform implements IPlatform {
  info: PlatformInfo = {
    type: 'desktop',
    os: detectOS(),
    version: '0.1.0', // TODO: Get from package.json
  };

  window = new TauriWindowControls();
  shell = new TauriShell();
  process = new TauriProcessControl();
}
