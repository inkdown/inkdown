import type React from 'react';
import '../styles/UI.css';

export interface SettingProps {
    name: React.ReactNode;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * A setting row with label, description, and control
 */
export function Setting({ name, description, children, className = '' }: SettingProps) {
    return (
        <div className={`ink-setting ${className}`}>
            <div className="ink-setting-info">
                <div className="ink-setting-name">{name}</div>
                {description && <div className="ink-setting-desc">{description}</div>}
            </div>
            <div className="ink-setting-control">{children}</div>
        </div>
    );
}
