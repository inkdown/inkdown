/**
 * ErrorBoundary Component
 * 
 * React error boundary for graceful error handling
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import '../styles/ErrorBoundary.css';

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
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught error:', error, errorInfo);
        }
        
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
 * Default error fallback component with styled UI
 */
function DefaultErrorFallback({ error }: { error: Error }) {
    const handleReload = () => {
        window.location.reload();
    };

    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="error-boundary">
            {/* Error Icon */}
            <svg 
                className="error-boundary__icon"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
            </svg>

            <h2 className="error-boundary__title">Something went wrong</h2>
            
            <p className="error-boundary__message">{error.message}</p>

            <div className="error-boundary__actions">
                <button 
                    onClick={handleReload}
                    className="error-boundary__button error-boundary__button--primary"
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reload Application
                </button>
                
                <button 
                    onClick={handleGoBack}
                    className="error-boundary__button error-boundary__button--secondary"
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Go Back
                </button>
            </div>

            <details className="error-boundary__details">
                <summary>Error details</summary>
                <pre className="error-boundary__stack">
                    {error.stack}
                </pre>
            </details>
        </div>
    );
}
