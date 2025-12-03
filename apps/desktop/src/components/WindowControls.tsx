import { getCurrentWindow } from '@tauri-apps/api/window';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

/**
 * Platform detection
 */
const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Window control button icons (for Windows/Linux)
 */
const MinimizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
        <path fill="currentColor" d="M19 13H5v-2h14z" />
    </svg>
);

const MaximizeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
        <path fill="currentColor" d="M4 4h16v16H4zm2 4v10h12V8z" />
    </svg>
);

const RestoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
        <path fill="currentColor" d="M4 8h4V4h12v12h-4v4H4V8zm12 0v6h2V6H10v2h6zM6 10v8h8v-8H6z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
        <path
            fill="currentColor"
            d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"
        />
    </svg>
);

/**
 * Windows-style window control button
 */
interface WindowControlButtonProps {
    type: 'minimize' | 'maximize' | 'close';
    onClick: () => void;
    isMaximized?: boolean;
}

const WindowControlButton: React.FC<WindowControlButtonProps> = ({
    type,
    onClick,
    isMaximized = false,
}) => {
    const getIcon = () => {
        switch (type) {
            case 'minimize':
                return <MinimizeIcon />;
            case 'maximize':
                return isMaximized ? <RestoreIcon /> : <MaximizeIcon />;
            case 'close':
                return <CloseIcon />;
        }
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`window-control-button window-control-${type}`}
            style={{
                width: '46px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'default',
                transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
                if (type === 'close') {
                    e.currentTarget.style.backgroundColor = '#e81123';
                    e.currentTarget.style.color = '#ffffff';
                } else {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
            }}
        >
            {getIcon()}
        </button>
    );
};

/**
 * Window Controls Component
 * Renders platform-specific window controls (minimize, maximize, close)
 * On macOS with custom titlebar, traffic lights are rendered in the FileExplorer header
 * This component provides a draggable area on the right side
 */
export interface WindowControlsProps {
    /** Workspace name to display (macOS only) - deprecated, not shown anymore */
    workspaceName?: string;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ workspaceName: _workspaceName }) => {
    const [isMaximized, setIsMaximized] = useState(false);

    // Check if window is maximized on mount
    useEffect(() => {
        const checkMaximized = async () => {
            const window = getCurrentWindow();
            const maximized = await window.isMaximized();
            setIsMaximized(maximized);
        };
        checkMaximized();
    }, []);

    const handleMinimize = useCallback(async () => {
        const window = getCurrentWindow();
        await window.minimize();
    }, []);

    const handleMaximize = useCallback(async () => {
        const window = getCurrentWindow();
        await window.toggleMaximize();
        const maximized = await window.isMaximized();
        setIsMaximized(maximized);
    }, []);

    const handleClose = useCallback(async () => {
        const window = getCurrentWindow();
        await window.close();
    }, []);

    if (isMacOS) {
        // On macOS, traffic lights are in the FileExplorer header
        // This component just provides a draggable area on the right
        return (
            <div
                className="window-controls-macos-drag-area"
                data-tauri-drag-region
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    minWidth: '80px',
                    paddingRight: '12px',
                    WebkitAppRegion: 'drag',
                } as React.CSSProperties & { WebkitAppRegion: 'drag' | 'no-drag' }}
            />
        );
    }

    // Windows/Linux controls
    return (
        <div
            className="window-controls-windows"
            style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
            }}
        >
            <WindowControlButton type="minimize" onClick={handleMinimize} />
            <WindowControlButton type="maximize" onClick={handleMaximize} isMaximized={isMaximized} />
            <WindowControlButton type="close" onClick={handleClose} />
        </div>
    );
};
