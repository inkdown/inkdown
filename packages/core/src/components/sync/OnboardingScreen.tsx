import type React from 'react';
import { useState } from 'react';
import type { App } from '../../App';
import './OnboardingScreen.css';

interface OnboardingScreenProps {
    app: App;
    onComplete: () => void;
}

type OnboardingMode = 'welcome' | 'login' | 'register';

/**
 * OnboardingScreen - First-time user experience with login/register/skip options
 */
export function OnboardingScreen({ app, onComplete }: OnboardingScreenProps) {
    const [mode, setMode] = useState<OnboardingMode>('welcome');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await app.syncManager.login(email, password);
            await app.configManager.saveConfig('sync', {
                onboardingCompleted: true,
                enabled: true,
            });
            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await app.syncManager.authService.register({ username, email, password });
            // Auto-switch to login after successful registration
            setMode('login');
            setError(null);
            setUsername('');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        await app.configManager.saveConfig('sync', {
            onboardingCompleted: true,
            enabled: false,
        });
        onComplete();
    };

    if (mode === 'welcome') {
        return (
            <div className="onboarding-screen">
                <div className="onboarding-content">
                    <div className="onboarding-header">
                        <h1>Inkdown</h1>
                        <p>Your markdown notes, synchronized</p>
                    </div>

                    <div className="onboarding-actions">
                        <button
                            type="button"
                            className="onboarding-button primary"
                            onClick={() => setMode('login')}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            className="onboarding-button secondary"
                            onClick={() => setMode('register')}
                        >
                            Create Account
                        </button>
                        <button
                            type="button"
                            className="onboarding-button ghost"
                            onClick={handleSkip}
                        >
                            Skip (Use Offline)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'login') {
        return (
            <div className="onboarding-screen">
                <div className="onboarding-form-container">
                    <div className="onboarding-form-header">
                        <h2>Login</h2>
                    </div>

                    {error && <div className="onboarding-error">{error}</div>}

                    <form className="onboarding-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="onboarding-button primary full-width"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <button
                        type="button"
                        className="onboarding-back-button"
                        onClick={() => setMode('welcome')}
                        disabled={loading}
                    >
                        ← Back
                    </button>
                </div>
            </div>
        );
    }

    // Register mode
    return (
        <div className="onboarding-screen">
            <div className="onboarding-form-container">
                <div className="onboarding-form-header">
                    <h2>Create Account</h2>
                </div>

                {error && <div className="onboarding-error">{error}</div>}

                <form className="onboarding-form" onSubmit={handleRegister}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="johndoe"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={8}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm-password">Confirm Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="onboarding-button primary full-width"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <button
                    type="button"
                    className="onboarding-back-button"
                    onClick={() => setMode('welcome')}
                    disabled={loading}
                >
                    ← Back
                </button>
            </div>
        </div>
    );
}
