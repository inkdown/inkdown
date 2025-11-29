import type React from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import '../styles/Modal.css';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
    showCloseButton?: boolean;
}

/**
 * Generic modal component with overlay and close functionality
 */
export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    showCloseButton = true,
}: ModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="ink-modal-overlay" onClick={onClose}>
            <div
                className={`ink-modal ink-modal-${size}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="ink-modal-header">
                        <h2>{title}</h2>
                        {showCloseButton && (
                            <button className="ink-modal-close" onClick={onClose}>
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}
                <div className="ink-modal-body">{children}</div>
            </div>
        </div>
    );
}
