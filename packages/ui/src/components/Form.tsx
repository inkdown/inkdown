import type React from 'react';
import { useState } from 'react';

export interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
    onSubmit: (data: FormData) => void | Promise<void>;
    children: React.ReactNode;
}

/**
 * Form wrapper with async submit handling and loading state
 */
export function Form({ onSubmit, children, className = '', ...props }: FormProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget);
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className={`ink-form ${loading ? 'ink-form-loading' : ''} ${className}`}
            onSubmit={handleSubmit}
            {...props}
        >
            {children}
        </form>
    );
}
