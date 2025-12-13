import type React from 'react';
import '../styles/UI.css';

export interface TextInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    small?: boolean;
}

/**
 * Styled text input component
 */
export function TextInput({
    value,
    onChange,
    small = false,
    className = '',
    ...props
}: TextInputProps) {
    return (
        <input
            type="text"
            className={`ink-input ${small ? 'ink-input-small' : ''} ${className}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        />
    );
}
