import type React from 'react';
import '../styles/UI.css';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps
    extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
}

/**
 * Styled select/dropdown component
 */
export function Select({ value, onChange, options, className = '', ...props }: SelectProps) {
    return (
        <select
            className={`ink-select ${className}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
