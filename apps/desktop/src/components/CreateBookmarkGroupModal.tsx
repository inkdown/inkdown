import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import './CreateBookmarkGroupModal.css';

interface CreateBookmarkGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, description?: string, color?: string) => void;
}

export const CreateBookmarkGroupModal: React.FC<CreateBookmarkGroupModalProps> = ({
    isOpen,
    onClose,
    onCreate,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
            setColor('');
            // Focus input after modal opens
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (trimmedName) {
            onCreate(trimmedName, description.trim() || undefined, color || undefined);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="create-bookmark-group-modal-backdrop" onClick={onClose}>
            <div
                className="create-bookmark-group-modal"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className="create-bookmark-group-modal-header">
                    <h2>Create Bookmark Group</h2>
                    <button
                        className="create-bookmark-group-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="create-bookmark-group-modal-body">
                        <div className="create-bookmark-group-form-group">
                            <label htmlFor="group-name">
                                Group Name <span className="required">*</span>
                            </label>
                            <input
                                ref={inputRef}
                                id="group-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Work, Personal, Reading List"
                                required
                            />
                        </div>

                        <div className="create-bookmark-group-form-group">
                            <label htmlFor="group-description">Description (optional)</label>
                            <textarea
                                id="group-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this group for?"
                                rows={3}
                            />
                        </div>

                        <div className="create-bookmark-group-form-group">
                            <label htmlFor="group-color">Color (optional)</label>
                            <input
                                id="group-color"
                                type="text"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                placeholder="e.g., #3b82f6, blue, rgb(59, 130, 246)"
                            />
                        </div>
                    </div>

                    <div className="create-bookmark-group-modal-footer">
                        <button
                            type="button"
                            className="create-bookmark-group-button secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="create-bookmark-group-button primary"
                            disabled={!name.trim()}
                        >
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
