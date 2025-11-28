import type React from 'react';
import '../styles/UI.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    size?: 'small' | 'medium' | 'large';
    children: React.ReactNode;
}

/**
 * Styled button component
 */
export function Button({
    variant = 'secondary',
    size = 'medium',
    className = '',
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={`ink-button ink-button-${variant} ink-button-${size} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
