import type React from 'react';
import '../styles/UI.css';

export interface SettingSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * A section container for grouping related settings
 */
export function SettingSection({
    title,
    description,
    children,
    className = '',
}: SettingSectionProps) {
    return (
        <div className={`ink-setting-section ${className}`}>
            <h3 className="ink-setting-section-title">{title}</h3>
            {description && <p className="ink-setting-section-desc">{description}</p>}
            <div className="ink-setting-section-content">{children}</div>
        </div>
    );
}
