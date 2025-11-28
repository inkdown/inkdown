import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import '../styles/Sidebar.css';

export interface SidebarProps {
    /** Whether the sidebar is collapsed */
    isCollapsed: boolean;
    /** Current width of the sidebar (when not collapsed) */
    width: number;
    /** Minimum width for resize */
    minWidth?: number;
    /** Maximum width for resize */
    maxWidth?: number;
    /** Callback when collapsed state changes */
    onCollapsedChange: (collapsed: boolean) => void;
    /** Callback when width changes */
    onWidthChange: (width: number) => void;
    /** The content to render inside the sidebar */
    children: React.ReactNode;
}

const DEFAULT_MIN_WIDTH = 180;
const DEFAULT_MAX_WIDTH = 500;

export const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    width,
    minWidth = DEFAULT_MIN_WIDTH,
    maxWidth = DEFAULT_MAX_WIDTH,
    onCollapsedChange,
    onWidthChange,
    children,
}) => {
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(0);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsResizing(true);
            startXRef.current = e.clientX;
            startWidthRef.current = width;

            // Add global listeners
            const handleMouseMove = (e: MouseEvent) => {
                const diff = e.clientX - startXRef.current;
                const newWidth = Math.max(
                    minWidth,
                    Math.min(maxWidth, startWidthRef.current + diff),
                );
                onWidthChange(newWidth);
            };

            const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        },
        [width, minWidth, maxWidth, onWidthChange],
    );

    // Double-click on resize handle to reset to default width
    const handleDoubleClick = useCallback(() => {
        onWidthChange(250); // Default width
    }, [onWidthChange]);

    // Toggle collapse on clicking the collapse button
    const handleToggle = useCallback(() => {
        onCollapsedChange(!isCollapsed);
    }, [isCollapsed, onCollapsedChange]);

    return (
        <div
            ref={sidebarRef}
            className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isResizing ? 'resizing' : ''}`}
            style={{
                width: isCollapsed ? 0 : width,
                minWidth: isCollapsed ? 0 : minWidth,
            }}
        >
            {!isCollapsed && (
                <>
                    <div className="sidebar-content">{children}</div>

                    {/* Resize handle */}
                    <div
                        className="sidebar-resize-handle"
                        onMouseDown={handleMouseDown}
                        onDoubleClick={handleDoubleClick}
                        title="Drag to resize, double-click to reset"
                    />
                </>
            )}

            {/* Toggle button - always visible */}
            <button
                className={`sidebar-toggle ${isCollapsed ? 'collapsed' : ''}`}
                onClick={handleToggle}
                title={isCollapsed ? 'Show sidebar (Ctrl+\\)' : 'Hide sidebar (Ctrl+\\)'}
                aria-label={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}
                >
                    <path d="M10 3L5 8L10 13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
};
