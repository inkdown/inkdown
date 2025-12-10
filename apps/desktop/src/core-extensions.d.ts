
import '@inkdown/core';
import { KeybindingManager } from './managers/KeybindingManager';
import { WindowConfigManager } from './managers/WindowConfigManager';

declare module '@inkdown/core' {
    interface App {
        windowConfigManager: WindowConfigManager;
        keybindingManager?: KeybindingManager;
    }
}
