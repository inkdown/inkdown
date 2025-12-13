import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandManager } from '@inkdown/core/managers/CommandManager';
import type { App } from '@inkdown/core/App';
import type { Command } from '@inkdown/core/types/plugin';

describe('CommandManager', () => {
    let commandManager: CommandManager;
    let mockApp: App;

    const mockCreateEmptyTab = vi.fn();
    const mockCloseTab = vi.fn();
    const mockSwitchToNextTab = vi.fn();
    const mockSwitchToPreviousTab = vi.fn();
    const mockSwitchToTabByIndex = vi.fn();
    const mockGetActiveTab = vi.fn();
    const mockSaveFile = vi.fn<(path: string) => Promise<void>>();
    const mockOpenTab = vi.fn<(path: string) => Promise<void>>();
    const mockCreateNewNote = vi.fn<() => Promise<string>>();

    beforeEach(() => {
        vi.clearAllMocks();

        mockApp = {
            tabManager: {
                createEmptyTab: mockCreateEmptyTab,
                closeTab: mockCloseTab,
                switchToNextTab: mockSwitchToNextTab,
                switchToPreviousTab: mockSwitchToPreviousTab,
                switchToTabByIndex: mockSwitchToTabByIndex,
                getActiveTab: mockGetActiveTab,
                openTab: mockOpenTab,
            },
            editorStateManager: {
                saveFile: mockSaveFile,
            },
            filesConfigManager: {
                createNewNote: mockCreateNewNote,
            },
            workspace: {
                _onFileCreate: vi.fn(),
            },
        } as unknown as App;

        commandManager = new CommandManager(mockApp);
    });

    describe('registerCommand', () => {
        it('should register a command', () => {
            const command: Command = {
                id: 'test-command',
                name: 'Test Command',
                callback: vi.fn(),
            };

            commandManager.registerCommand(command);

            expect(commandManager.getCommand('test-command')).toBeDefined();
        });

        it('should allow registering multiple commands', () => {
            commandManager.registerCommand({ id: 'cmd-1', name: 'Cmd 1', callback: vi.fn() });
            commandManager.registerCommand({ id: 'cmd-2', name: 'Cmd 2', callback: vi.fn() });

            expect(commandManager.getCommands().length).toBe(2);
        });

        it('should overwrite existing command with same ID', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            commandManager.registerCommand({ id: 'cmd-1', name: 'Old', callback: callback1 });
            commandManager.registerCommand({ id: 'cmd-1', name: 'New', callback: callback2 });

            const cmd = commandManager.getCommand('cmd-1');
            expect(cmd?.name).toBe('New');
        });
    });

    describe('unregisterCommand', () => {
        it('should remove a registered command', () => {
            commandManager.registerCommand({ id: 'cmd-1', name: 'Cmd 1', callback: vi.fn() });

            commandManager.unregisterCommand('cmd-1');

            expect(commandManager.getCommand('cmd-1')).toBeUndefined();
        });

        it('should handle unregistering non-existent command', () => {
            // Should not throw
            commandManager.unregisterCommand('nonexistent');
        });
    });

    describe('executeCommand', () => {
        it('should execute command callback', () => {
            const callback = vi.fn();
            commandManager.registerCommand({ id: 'test-cmd', name: 'Test', callback });

            const result = commandManager.executeCommand('test-cmd');

            expect(callback).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return false for non-existent command', () => {
            const result = commandManager.executeCommand('nonexistent');

            expect(result).toBe(false);
        });

        it('should handle checkCallback', () => {
            const checkCallback = vi.fn().mockReturnValue(true);
            commandManager.registerCommand({
                id: 'check-cmd',
                name: 'Check',
                callback: vi.fn(),
                checkCallback,
            });

            const result = commandManager.executeCommand('check-cmd');

            expect(checkCallback).toHaveBeenCalledWith(true); // checking
            expect(checkCallback).toHaveBeenCalledWith(false); // executing
            expect(result).toBe(true);
        });

        it('should not execute if checkCallback returns false', () => {
            const checkCallback = vi.fn().mockReturnValue(false);
            commandManager.registerCommand({
                id: 'check-cmd',
                name: 'Check',
                callback: vi.fn(),
                checkCallback,
            });

            const result = commandManager.executeCommand('check-cmd');

            expect(checkCallback).toHaveBeenCalledWith(true);
            expect(checkCallback).toHaveBeenCalledTimes(1); // only checking, not executing
            expect(result).toBe(false);
        });

        it('should handle switch-tab-N commands', () => {
            const result = commandManager.executeCommand('switch-tab-1');

            expect(mockSwitchToTabByIndex).toHaveBeenCalledWith(0);
            expect(result).toBe(true);
        });

        it('should handle switch-tab-5 commands', () => {
            const result = commandManager.executeCommand('switch-tab-5');

            expect(mockSwitchToTabByIndex).toHaveBeenCalledWith(4);
            expect(result).toBe(true);
        });

        it('should handle async callback', async () => {
            const asyncCallback = vi.fn().mockResolvedValue(undefined);
            commandManager.registerCommand({
                id: 'async-cmd',
                name: 'Async',
                callback: asyncCallback,
            });

            const result = commandManager.executeCommand('async-cmd');

            expect(asyncCallback).toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });

    describe('getCommands', () => {
        it('should return all registered commands', () => {
            commandManager.registerCommand({ id: 'cmd-1', name: 'Cmd 1', callback: vi.fn() });
            commandManager.registerCommand({ id: 'cmd-2', name: 'Cmd 2', callback: vi.fn() });

            const commands = commandManager.getCommands();

            expect(commands.length).toBe(2);
            expect(commands.map((c) => c.id)).toContain('cmd-1');
            expect(commands.map((c) => c.id)).toContain('cmd-2');
        });

        it('should return empty array when no commands registered', () => {
            expect(commandManager.getCommands()).toEqual([]);
        });
    });

    describe('getCommand', () => {
        it('should return command by ID', () => {
            commandManager.registerCommand({ id: 'cmd-1', name: 'Cmd 1', callback: vi.fn() });

            const cmd = commandManager.getCommand('cmd-1');

            expect(cmd?.id).toBe('cmd-1');
            expect(cmd?.name).toBe('Cmd 1');
        });

        it('should return undefined for non-existent ID', () => {
            expect(commandManager.getCommand('nonexistent')).toBeUndefined();
        });
    });

    describe('registerCoreCommands', () => {
        beforeEach(() => {
            commandManager.registerCoreCommands();
        });

        it('should register tab:new-tab command', () => {
            expect(commandManager.getCommand('tab:new-tab')).toBeDefined();
        });

        it('should register tab:close-tab command', () => {
            expect(commandManager.getCommand('tab:close-tab')).toBeDefined();
        });

        it('should register tab:save-file command', () => {
            expect(commandManager.getCommand('tab:save-file')).toBeDefined();
        });

        it('should register tab:next-tab command', () => {
            expect(commandManager.getCommand('tab:next-tab')).toBeDefined();
        });

        it('should register tab:previous-tab command', () => {
            expect(commandManager.getCommand('tab:previous-tab')).toBeDefined();
        });

        it('should register file:new-note command', () => {
            expect(commandManager.getCommand('file:new-note')).toBeDefined();
        });

        it('should register app:toggle-sidebar command', () => {
            expect(commandManager.getCommand('app:toggle-sidebar')).toBeDefined();
        });

        describe('core command execution', () => {
            it('tab:new-tab should create empty tab', () => {
                commandManager.executeCommand('tab:new-tab');

                expect(mockCreateEmptyTab).toHaveBeenCalled();
            });

            it('tab:close-tab should close active tab', () => {
                mockGetActiveTab.mockReturnValue({ id: 'tab-1' });

                commandManager.executeCommand('tab:close-tab');

                expect(mockCloseTab).toHaveBeenCalledWith('tab-1');
            });

            it('tab:close-tab should do nothing if no active tab', () => {
                mockGetActiveTab.mockReturnValue(null);

                commandManager.executeCommand('tab:close-tab');

                expect(mockCloseTab).not.toHaveBeenCalled();
            });

            it('tab:save-file should save active file', async () => {
                mockGetActiveTab.mockReturnValue({ id: 'tab-1', filePath: '/path/to/file.md' });
                mockSaveFile.mockResolvedValue(undefined);

                commandManager.executeCommand('tab:save-file');

                // Wait for async operation
                await vi.waitFor(() => {
                    expect(mockSaveFile).toHaveBeenCalledWith('/path/to/file.md');
                });
            });

            it('tab:save-file should do nothing if no file path', () => {
                mockGetActiveTab.mockReturnValue({ id: 'tab-1', filePath: null });

                commandManager.executeCommand('tab:save-file');

                expect(mockSaveFile).not.toHaveBeenCalled();
            });

            it('tab:next-tab should switch to next tab', () => {
                commandManager.executeCommand('tab:next-tab');

                expect(mockSwitchToNextTab).toHaveBeenCalled();
            });

            it('tab:previous-tab should switch to previous tab', () => {
                commandManager.executeCommand('tab:previous-tab');

                expect(mockSwitchToPreviousTab).toHaveBeenCalled();
            });
        });
    });
});
