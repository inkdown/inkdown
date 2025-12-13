import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import './BookmarkGroupModal.css';

export interface BookmarkGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    filePath: string;
    fileName: string;
}

/**
 * Modal for selecting or creating a bookmark group
 */
export const BookmarkGroupModal: React.FC<BookmarkGroupModalProps> = ({
    isOpen,
    onClose,
    filePath,
    fileName,
}) => {
    const app = useApp();
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load last selected group or get all groups
    useEffect(() => {
        if (isOpen) {
            const lastGroupId = app.bookmarkManager.getLastSelectedGroupId();
            if (lastGroupId) {
                const group = app.bookmarkManager.getGroup(lastGroupId);
                if (group) {
                    setInputValue(group.name);
                }
            }
            setError(null);
            // Focus input after modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setInputValue('');
            setSelectedIndex(-1);
            setShowSuggestions(false);
            setIsCreatingNew(false);
        }
    }, [isOpen, app.bookmarkManager]);

    // Update suggestions based on input
    useEffect(() => {
        if (!inputValue.trim()) {
            setSuggestions(app.bookmarkManager.getGroupNames());
            setShowSuggestions(false);
            setIsCreatingNew(false);
            return;
        }

        const allGroups = app.bookmarkManager.getGroupNames();
        const filtered = allGroups.filter((name) =>
            name.toLowerCase().includes(inputValue.toLowerCase()),
        );

        // Check if exact match exists
        const exactMatch = allGroups.find(
            (name) => name.toLowerCase() === inputValue.toLowerCase(),
        );

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0 || !exactMatch);
        setIsCreatingNew(!exactMatch && filtered.length === 0);
        setSelectedIndex(-1);
    }, [inputValue, app.bookmarkManager]);

    const handleAddBookmark = useCallback(async () => {
        const groupName = inputValue.trim();

        if (!groupName) {
            setError('Please enter a group name');
            return;
        }

        try {
            // Find existing group or create new one
            const existingGroups = app.bookmarkManager.getGroups();
            let group = existingGroups.find(
                (g) => g.name.toLowerCase() === groupName.toLowerCase(),
            );

            if (!group) {
                // Create new group
                group = await app.bookmarkManager.createGroup(groupName);
            }

            // Add bookmark to group
            await app.bookmarkManager.addBookmark(
                group.id,
                filePath,
                fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName,
            );

            onClose();
        } catch (error: any) {
            setError(error.message || 'Failed to add bookmark');
            console.error('Failed to add bookmark:', error);
        }
    }, [inputValue, filePath, fileName, app.bookmarkManager, onClose]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            if (e.key === 'Enter') {
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    setInputValue(suggestions[selectedIndex]);
                    setShowSuggestions(false);
                } else {
                    handleAddBookmark();
                }
                return;
            }

            if (!showSuggestions || suggestions.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
            }
        },
        [selectedIndex, suggestions, showSuggestions, onClose, handleAddBookmark],
    );

    const handleSuggestionClick = useCallback((suggestion: string) => {
        setInputValue(suggestion);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    }, []);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="bookmark-modal-backdrop" onClick={onClose} />

            {/* Modal */}
            <div className="bookmark-modal">
                <div className="bookmark-modal-header">
                    <h3>Add to Bookmarks</h3>
                    <button
                        type="button"
                        className="bookmark-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="bookmark-modal-content">
                    <div className="bookmark-modal-file-info">
                        <span className="bookmark-modal-file-name">{fileName}</span>
                    </div>

                    <div className="bookmark-modal-input-container">
                        <label htmlFor="bookmark-group-input">Bookmark Group</label>
                        <div className="bookmark-modal-input-wrapper">
                            <input
                                ref={inputRef}
                                id="bookmark-group-input"
                                type="text"
                                className="bookmark-modal-input"
                                placeholder="Enter or select a group..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setShowSuggestions(true)}
                            />
                            {isCreatingNew && (
                                <span className="bookmark-modal-new-badge">New group</span>
                            )}
                        </div>

                        {/* Suggestions dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="bookmark-modal-suggestions">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={suggestion}
                                        className={`bookmark-modal-suggestion-item ${
                                            index === selectedIndex ? 'selected' : ''
                                        }`}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <span>{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && <div className="bookmark-modal-error">{error}</div>}
                </div>

                <div className="bookmark-modal-footer">
                    <button
                        type="button"
                        className="bookmark-modal-button secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="bookmark-modal-button primary"
                        onClick={handleAddBookmark}
                    >
                        Add Bookmark
                    </button>
                </div>
            </div>
        </>
    );
};
