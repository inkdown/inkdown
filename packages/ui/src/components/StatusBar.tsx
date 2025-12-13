import type React from 'react';
import '../styles/StatusBar.css';

export interface StatusBarItem {
    id: string;
    content: React.ReactNode;
}

export interface StatusBarProps {
    items?: {
        left?: StatusBarItem[];
        right?: StatusBarItem[];
    };
    children?: React.ReactNode;
}

/**
 * Status Bar Component - Displays information at the bottom of the app
 */
export const StatusBar: React.FC<StatusBarProps> = ({ items, children }) => {
    return (
        <div className="status-bar">
            <div className="status-bar-left">
                {items?.left?.map((item) => (
                    <div key={item.id} className="status-bar-item">
                        {item.content}
                    </div>
                ))}
            </div>
            <div className="status-bar-right" id="status-bar-right">
                {items?.right?.map((item) => (
                    <div key={item.id} className="status-bar-item">
                        {item.content}
                    </div>
                ))}
                {children}
            </div>
        </div>
    );
};
