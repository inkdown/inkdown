/**
 * ErrorBoundary Component
 * 
 * React error boundary for graceful error handling
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error) => ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Call optional onError callback
        this.props.onError?.(error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback(this.state.error);
            }

            // Default fallback UI
            return <DefaultErrorFallback error={this.state.error} />;
        }

        return this.props.children;
    }
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error }: { error: Error }) {
    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="error-boundary" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <p>{error.message}</p>
            
            <details style={{ marginTop: '1rem', textAlign: 'left', maxWidth: '600px', margin: '1rem auto' }}>
                <summary>Error details</summary>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px', overflow: 'auto' }}>
                    {error.stack}
                </pre>
            </details>

            <button 
                onClick={handleReload}
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
                Reload Application
            </button>
        </div>
    );
}
