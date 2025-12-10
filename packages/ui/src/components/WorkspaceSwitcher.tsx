import type { RecentWorkspace } from '@inkdown/core';
import { Check, ChevronDown, FolderOpen } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './WorkspaceSwitcher.css';

export interface WorkspaceSwitcherProps {
    /** Current workspace absolute path */
    currentWorkspace: string;
    /** List of recent workspaces */
    recentWorkspaces: RecentWorkspace[];
    /** Callback when workspace is selected */
    onSelect: (path: string) => void;
    /** Callback to browse for new workspace */
    onBrowse: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
    currentWorkspace,
    recentWorkspaces,
    onSelect,
    onBrowse,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    // Get current workspace name
    const currentName =
        recentWorkspaces.find((ws) => ws.path === currentWorkspace)?.name ||
        currentWorkspace.split(/[/\\]/).pop() ||
        'Workspace';

    // Update position when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node) &&
                !(event.target as Element).closest('.workspace-switcher-dropdown')
            ) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            if (isOpen) setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [isOpen]);

    const handleSelect = (path: string) => {
        setIsOpen(false);
        if (path !== currentWorkspace) {
            onSelect(path);
        }
    };

    const handleBrowse = () => {
        setIsOpen(false);
        onBrowse();
    };

    const dropdown = (
        <div
            className="workspace-switcher-dropdown"
            style={{
                top: position.top,
                left: position.left,
                minWidth: position.width,
            }}
        >
            {recentWorkspaces.length > 0 ? (
                <>
                    {recentWorkspaces.map((workspace) => (
                        <button
                            type="button"
                            key={workspace.path}
                            className={`workspace-switcher-item ${workspace.path === currentWorkspace ? 'active' : ''}`}
                            onClick={() => handleSelect(workspace.path)}
                            title={workspace.path}
                        >
                            <span className="workspace-switcher-item-name">{workspace.name}</span>
                            {workspace.path === currentWorkspace && (
                                <Check size={14} className="workspace-switcher-check" />
                            )}
                        </button>
                    ))}
                    <div className="workspace-switcher-separator" />
                </>
            ) : null}

            <button type="button" className="workspace-switcher-item" onClick={handleBrowse}>
                <FolderOpen size={14} />
                <span>Switch workspace...</span>
            </button>
        </div>
    );

    return (
        <div className="workspace-switcher">
            <button
                type="button"
                ref={buttonRef}
                className="workspace-switcher-button"
                onClick={() => setIsOpen(!isOpen)}
                title={currentWorkspace}
            >
                <span className="workspace-switcher-name">{currentName}</span>
                <ChevronDown
                    size={14}
                    className={`workspace-switcher-icon ${isOpen ? 'open' : ''}`}
                />
            </button>

            {isOpen && createPortal(dropdown, document.body)}
        </div>
    );
};
