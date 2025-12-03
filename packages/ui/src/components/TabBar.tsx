import { PanelLeftClose, X } from 'lucide-react';
import React from 'react';
import '../styles/TabBar.css';

export interface TabProps {
    id: string;
    title: string;
    isActive: boolean;
    isDirty: boolean;
    onClick: () => void;
    onClose: () => void;
}

export const Tab: React.FC<TabProps> = React.memo(
    ({ id, title, isActive, isDirty, onClick, onClose }) => {
        const handleClose = (e: React.MouseEvent) => {
            e.stopPropagation();
            onClose();
        };

        return (
            <div
                className={`tab ${isActive ? 'tab-active' : ''}`}
                onClick={onClick}
                data-tab-id={id}
            >
                <span className="tab-title">
                    {isDirty && <span className="tab-dirty-indicator">●</span>}
                    {title}
                </span>
                <button className="tab-close" onClick={handleClose} aria-label="Close tab">
                    <X size={14} />
                </button>
            </div>
        );
    },
);

Tab.displayName = 'Tab';

export interface TabBarTab {
    id: string;
    title: string;
    isDirty: boolean;
    filePath?: string;
}

export interface TabBarProps {
    tabs: TabBarTab[];
    activeTabId: string | null;
    onTabSelect: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    sidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
    windowControls?: React.ReactNode;
}

/**
 * TabBar Component - Displays all open tabs with sidebar toggle
 */
export const TabBar: React.FC<TabBarProps> = ({
    tabs,
    activeTabId,
    onTabSelect,
    onTabClose,
    sidebarCollapsed,
    onToggleSidebar,
    windowControls,
}) => {
    return (
        <div className="tab-bar" data-tauri-drag-region>
            {onToggleSidebar && (
                <button
                    className="tab-bar-toggle"
                    onClick={onToggleSidebar}
                    title={sidebarCollapsed ? 'Show sidebar (Ctrl+\\)' : 'Hide sidebar (Ctrl+\\)'}
                >
                    <PanelLeftClose size={18} />
                </button>
            )}
            <div className="tab-list">
                {tabs.map((tab) => (
                    <Tab
                        key={tab.id}
                        id={tab.id}
                        title={tab.title}
                        isActive={tab.id === activeTabId}
                        isDirty={tab.isDirty}
                        onClick={() => onTabSelect(tab.id)}
                        onClose={() => onTabClose(tab.id)}
                    />
                ))}
            </div>
            {/* Draggable area after tabs */}
            <div className="tab-bar-drag-area" data-tauri-drag-region />
            {windowControls && <div className="tab-bar-window-controls">{windowControls}</div>}
        </div>
    );
};
