import type React from 'react';
import '../styles/UI.css';

export interface TextAreaProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
}

/**
 * Styled textarea component
 */
export function TextArea({ value, onChange, className = '', ...props }: TextAreaProps) {
    return (
        <textarea
            className={`ink-textarea ${className}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        />
    );
}
