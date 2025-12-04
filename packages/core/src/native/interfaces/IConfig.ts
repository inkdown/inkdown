/**
 * IConfig Interface
 * 
 * Configuration operations - REQUIRED on all platforms
 */

export interface IConfig {
  /**
   * Get the app configuration directory path
   */
  getConfigDir(): Promise<string>;
  
  /**
   * Get the app cache directory path
   */
  getCacheDir(): Promise<string>;
  
  /**
   * Get the app data directory path
   */
  getDataDir(): Promise<string>;
  
  /**
   * Read a configuration file as raw string
   * @returns File content as string
   */
  readConfigFile(fileName: string): Promise<string>;
  
  /**
   * Write content to a configuration file
   * @param fileName - Name of the config file
   * @param content - Content to write (raw string)
   */
  writeConfigFile(fileName: string, content: string): Promise<void>;
}
