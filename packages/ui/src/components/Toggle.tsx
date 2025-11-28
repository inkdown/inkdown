import '../styles/UI.css';

export interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Styled toggle/switch component
 */
export function Toggle({ checked, onChange, disabled = false, className = '' }: ToggleProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            className={`ink-toggle ${checked ? 'ink-toggle-checked' : ''} ${disabled ? 'ink-toggle-disabled' : ''} ${className}`}
            onClick={() => !disabled && onChange(!checked)}
        >
            <span className="ink-toggle-thumb" />
        </button>
    );
}
