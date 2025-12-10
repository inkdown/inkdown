import { RotateCcw } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { KeybindingManager } from '../managers/KeybindingManager';
import './ShortcutsSettings.css';

interface ShortcutItem {
    id: string;
    name: string;
    keys: string[];
    source: 'core' | 'plugin';
    editable: boolean;
    pluginId?: string;
}

/**
 * ShortcutsSettings Component
 * Displays all registered shortcuts grouped by category with editing capabilities
 */
export const ShortcutsSettings: React.FC = () => {
    const app = useApp();
    const keybindingManager = app.keybindingManager as KeybindingManager;
    const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
    const [conflict, setConflict] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Function to load shortcuts
    const loadShortcuts = useCallback(() => {
        if (!keybindingManager) return;
        const allShortcuts = keybindingManager.getAllShortcuts();
        setShortcuts(allShortcuts as ShortcutItem[]);
    }, [keybindingManager]);

    // Load shortcuts on mount
    useEffect(() => {
        loadShortcuts();

        // Subscribe to shortcut changes
        const handleShortcutChange = () => {
            loadShortcuts();
        };

        // Listen for custom event from ShortcutManager
        window.addEventListener('shortcut-changed', handleShortcutChange);

        return () => {
            window.removeEventListener('shortcut-changed', handleShortcutChange);
        };
    }, [loadShortcuts]);

    // Handle keyboard recording
    useEffect(() => {
        if (!editingId) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // Build key combination
            const keys: string[] = [];

            // Add modifiers in consistent order
            if (e.ctrlKey || e.metaKey) keys.push('Mod');
            if (e.altKey) keys.push('Alt');
            if (e.shiftKey) keys.push('Shift');

            // Get the main key
            let key = e.key;

            // Skip if only modifier keys are pressed
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
                return;
            }

            // Normalize key names
            if (key === ' ') key = 'Space';
            else if (key.length === 1) key = key.toUpperCase();

            keys.push(key);

            // Check for conflicts
            const conflictId = keybindingManager.checkConflict(keys, editingId);
            if (conflictId) {
                setConflict(conflictId);
            } else {
                setConflict(null);
            }

            setRecordedKeys(keys);
        };

        const handleKeyUp = async () => {
            // Only save when all keys are released and we have a valid combination
            if (recordedKeys.length > 1 && !conflict) {
                // Check if we have at least one modifier + one key
                const hasModifier = recordedKeys.some((k) => ['Mod', 'Alt', 'Shift'].includes(k));
                const hasKey = recordedKeys.some((k) => !['Mod', 'Alt', 'Shift'].includes(k));

                if (hasModifier && hasKey) {
                    try {
                        await keybindingManager.updateShortcut(editingId!, recordedKeys);
                        loadShortcuts();
                        setEditingId(null);
                        setRecordedKeys([]);
                    } catch (error: any) {
                        console.error('Failed to update shortcut:', error);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
        };
    }, [editingId, recordedKeys, conflict, keybindingManager, loadShortcuts]);

    // Cancel editing on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && editingId) {
                setEditingId(null);
                setRecordedKeys([]);
                setConflict(null);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [editingId]);

    const formatKeys = (keys: string[]): string => {
        const isMac = navigator.platform.toUpperCase().includes('MAC');
        return keys
            .map((k) => {
                if (k === 'Mod') return isMac ? '⌘' : 'Ctrl';
                if (k === 'Shift') return isMac ? '⇧' : 'Shift';
                if (k === 'Alt') return isMac ? '⌥' : 'Alt';
                if (k === 'Tab') return '⇥';
                if (k === 'Space') return '␣';
                if (k === 'Escape') return 'Esc';
                if (k === 'Backspace') return '⌫';
                if (k === 'Enter') return '↵';
                if (k === 'ArrowUp') return '↑';
                if (k === 'ArrowDown') return '↓';
                if (k === 'ArrowLeft') return '←';
                if (k === 'ArrowRight') return '→';
                return k;
            })
            .join(' + ');
    };

    const startEditing = (id: string) => {
        setEditingId(id);
        setRecordedKeys([]);
        setConflict(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setRecordedKeys([]);
        setConflict(null);
    };

    const resetShortcut = async (id: string) => {
        try {
            await keybindingManager.resetShortcut(id);
            loadShortcuts();
        } catch (error: any) {
            console.error('Failed to reset shortcut:', error);
        }
    };

    const isCustomized = (id: string): boolean => {
        return keybindingManager.isCustomized(id);
    };

    const categoryNames: Record<string, string> = {
        tab: 'Tab Management',
        'tab-switching': 'Tab Switching',
        file: 'File Operations',
        editor: 'Editor Formatting',
        app: 'Application',
        plugins: 'Plugins',
        other: 'Other',
    };

    // Filter shortcuts based on search query
    const filteredShortcuts = shortcuts.filter((shortcut) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            shortcut.name.toLowerCase().includes(query) ||
            shortcut.id.toLowerCase().includes(query) ||
            formatKeys(shortcut.keys).toLowerCase().includes(query)
        );
    });

    // Group filtered shortcuts by category
    const filteredGroupedShortcuts = filteredShortcuts.reduce(
        (acc, shortcut) => {
            // Plugin shortcuts go to "plugins" category
            let category: string;
            if (shortcut.source === 'plugin') {
                category = 'plugins';
            } else if (shortcut.id.includes(':')) {
                category = shortcut.id.split(':')[0];
            } else if (shortcut.id.startsWith('switch-tab')) {
                category = 'tab-switching';
            } else {
                category = 'other';
            }

            if (!acc[category]) acc[category] = [];
            acc[category].push(shortcut);
            return acc;
        },
        {} as Record<string, ShortcutItem[]>,
    );

    return (
        <div className="shortcuts-settings">
            {/* Search Input */}
            <div className="shortcuts-search">
                <input
                    type="text"
                    className="shortcuts-search-input"
                    placeholder="Search shortcuts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredShortcuts.length === 0 ? (
                <p className="shortcuts-empty">
                    {searchQuery
                        ? 'No shortcuts match your search.'
                        : 'No shortcuts registered yet.'}
                </p>
            ) : (
                Object.entries(filteredGroupedShortcuts)
                    .sort(([a], [b]) => {
                        const order = [
                            'tab',
                            'tab-switching',
                            'file',
                            'editor',
                            'app',
                            'plugins',
                            'other',
                        ];
                        return order.indexOf(a) - order.indexOf(b);
                    })
                    .map(([category, categoryShortcuts]) => (
                        <div key={category} className="shortcut-category">
                            <h4 className="shortcut-category-title">
                                {categoryNames[category] || category}
                            </h4>
                            {categoryShortcuts.map((shortcut) => {
                                const isEditing = editingId === shortcut.id;
                                const customized = isCustomized(shortcut.id);

                                return (
                                    <div key={shortcut.id} className="shortcut-item">
                                        <div className="shortcut-item-info">
                                            <div className="shortcut-item-header">
                                                <span className="shortcut-item-name">
                                                    {shortcut.name}
                                                </span>
                                                <span
                                                    className={`shortcut-badge ${shortcut.source}`}
                                                >
                                                    {shortcut.source}
                                                </span>
                                                {customized && (
                                                    <span
                                                        className="shortcut-customized"
                                                        title="Customized"
                                                    />
                                                )}
                                            </div>
                                            <span className="shortcut-item-id">{shortcut.id}</span>
                                        </div>

                                        <div className="shortcut-keys-container">
                                            {conflict && isEditing && (
                                                <span className="shortcut-conflict">
                                                    Conflict: {conflict}
                                                </span>
                                            )}

                                            <kbd
                                                className={`shortcut-keys ${isEditing ? 'recording' : ''} ${customized ? 'modified' : ''}`}
                                                onClick={() =>
                                                    shortcut.editable && startEditing(shortcut.id)
                                                }
                                                title={
                                                    shortcut.editable
                                                        ? 'Click to change shortcut'
                                                        : 'This shortcut cannot be changed'
                                                }
                                            >
                                                {isEditing
                                                    ? recordedKeys.length > 0
                                                        ? formatKeys(recordedKeys)
                                                        : 'Press keys...'
                                                    : formatKeys(shortcut.keys)}
                                            </kbd>

                                            <button
                                                type="button"
                                                className="shortcut-reset-btn"
                                                onClick={() => resetShortcut(shortcut.id)}
                                                disabled={!customized}
                                                title="Reset to default"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
            )}

            {editingId && (
                <div
                    className="shortcut-recording-overlay"
                    onClick={cancelEditing}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'transparent',
                        zIndex: 999,
                    }}
                />
            )}
        </div>
    );
};
