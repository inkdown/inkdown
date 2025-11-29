import { Button, TextInput } from '@inkdown/ui';
import { Lock, ShieldCheck, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
import './EncryptionPasswordModal.css';

interface EncryptionPasswordModalProps {
    isOpen: boolean;
    mode: 'setup' | 'unlock';
    onConfirm: (password: string) => Promise<void>;
    onCancel: () => void;
}

export const EncryptionPasswordModal: React.FC<EncryptionPasswordModalProps> = ({
    isOpen,
    mode,
    onConfirm,
    onCancel,
}) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!password) {
            setError('Password is required');
            return;
        }

        if (mode === 'setup' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (mode === 'setup' && password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm(password);
            // Clear state on success
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            console.error('Encryption operation failed:', err);
            setError(err.message || 'Operation failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="encryption-modal-overlay">
            <div className="encryption-modal">
                <div className="encryption-modal-header">
                    <div className="encryption-modal-icon">
                        {mode === 'setup' ? <ShieldCheck size={32} /> : <Lock size={32} />}
                    </div>
                    <h2>
                        {mode === 'setup'
                            ? 'Setup Encryption Password'
                            : 'Enter Encryption Password'}
                    </h2>
                </div>

                <div className="encryption-modal-body">
                    <p className="encryption-modal-description">
                        {mode === 'setup' ? (
                            <>
                                Create a dedicated password to encrypt your notes.
                                <br />
                                <strong>Warning:</strong> If you lose this password, you will lose access to your encrypted data. We cannot recover it for you.
                            </>
                        ) : (
                            <>
                                Please enter your encryption password to unlock your notes and enable synchronization.
                            </>
                        )}
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Password</label>
                            <TextInput
                                type="password"
                                value={password}
                                onChange={setPassword}
                                placeholder="Enter encryption password"
                                autoFocus
                            />
                        </div>

                        {mode === 'setup' && (
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <TextInput
                                    type="password"
                                    value={confirmPassword}
                                    onChange={setConfirmPassword}
                                    placeholder="Confirm encryption password"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="encryption-modal-error">
                                <ShieldAlert size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="encryption-modal-actions">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isLoading}
                                className={isLoading ? 'loading' : ''}
                            >
                                {isLoading
                                    ? 'Processing...'
                                    : mode === 'setup'
                                        ? 'Enable Encryption'
                                        : 'Unlock & Sync'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
