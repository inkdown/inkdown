/**
 * TauriConfig
 * 
 * Tauri implementation of IConfig
 */

import { invoke } from '@tauri-apps/api/core';
import type { IConfig } from '@inkdown/core/native';

export class TauriConfig implements IConfig {
  private configDir: string | null = null;

  async getConfigDir(): Promise<string> {
    if (!this.configDir) {
      this.configDir = await invoke<string>('get_config_dir');
    }
    return this.configDir;
  }

  async getCacheDir(): Promise<string> {
    // Tauri uses the same directory for cache
    return this.getConfigDir();
  }

  async getDataDir(): Promise<string> {
    // Tauri uses the same directory for data
    return this.getConfigDir();
  }

  async readConfigFile(fileName: string): Promise<string> {
    return invoke<string>('read_config_file', { fileName });
  }

  async writeConfigFile(fileName: string, content: string): Promise<void> {
    await invoke('write_config_file', { fileName, content });
  }
}
