import type React from 'react';
import type { App } from '@inkdown/core';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import '../styles/Link.css';

export interface LinkProps {
    href?: string;
    onClick?: () => void;
    external?: boolean;
    children: React.ReactNode;
    app?: App; // Required for external links
    className?: string;
}

/**
 * Consistent link component with external link handling via core API
 */
export function Link({
    href,
    onClick,
    external = false,
    children,
    app,
    className = '',
}: LinkProps) {
    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (onClick) {
            onClick();
            return;
        }

        if (external && href && app) {
            await app.openExternalLink(href);
        } else if (href) {
            // Internal navigation (not implemented yet, placeholder)
            console.log('Navigate to:', href);
        }
    };

    return (
        <a
            href={href || '#'}
            className={`ink-link ${external ? 'ink-link-external' : ''} ${className}`}
            onClick={handleClick}
        >
            {children}
            {external && <ExternalLinkIcon size={12} className="ink-link-icon" />}
        </a>
    );
}
