import '../styles/UI.css';

export interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    showValue?: boolean;
    unit?: string;
    className?: string;
}

/**
 * Styled slider/range input component
 */
export function Slider({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    showValue = true,
    unit = '',
    className = '',
}: SliderProps) {
    return (
        <div className={`ink-slider-wrapper ${className}`}>
            <input
                type="range"
                className="ink-slider"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
            />
            {showValue && (
                <span className="ink-slider-value">
                    {value}
                    {unit}
                </span>
            )}
        </div>
    );
}
