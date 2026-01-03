/**
 * ErrorBoundary Component Tests
 * 
 * Testing React error boundaries following TDD principles
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@inkdown/ui';

describe('ErrorBoundary', () => {
    const originalError = console.error;
    
    beforeEach(() => {
        // Suppress console.error during tests (React logs caught errors)
        console.error = vi.fn();
    });
    
    afterEach(() => {
        console.error = originalError;
    });

    describe('when no error occurs', () => {
        it('should render children normally', () => {
            render(
                <ErrorBoundary>
                    <div data-testid="child">Normal content</div>
                </ErrorBoundary>
            );

            expect(screen.getByTestId('child')).toBeInTheDocument();
            expect(screen.getByText('Normal content')).toBeInTheDocument();
        });
    });

    describe('when error occurs', () => {
        it('should catch error and display fallback UI', () => {
            const ThrowingComponent = () => {
                throw new Error('Test error');
            };

            render(
                <ErrorBoundary>
                    <ThrowingComponent />
                </ErrorBoundary>
            );

            // Should show error fallback, not the throwing component
            expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        });

        it('should display error message in fallback', () => {
            const errorMessage = 'Database connection failed';
            const ThrowingComponent = () => {
                throw new Error(errorMessage);
            };

            const { container } = render(
                <ErrorBoundary>
                    <ThrowingComponent />
                </ErrorBoundary>
            );

            // Check that error message is displayed somewhere in the fallback
            expect(container.textContent).toContain(errorMessage);
        });

        it('should call onError callback when provided', () => {
            const onError = vi.fn();
            const error = new Error('Test error');
            const ThrowingComponent = () => {
                throw error;
            };

            render(
                <ErrorBoundary onError={onError}>
                    <ThrowingComponent />
                </ErrorBoundary>
            );

            expect(onError).toHaveBeenCalledWith(
                error,
                expect.objectContaining({ componentStack: expect.any(String) })
            );
        });

        it('should use custom fallback when provided', () => {
            const customFallback = (error: Error) => (
                <div data-testid="custom-fallback">
                    Custom error: {error.message}
                </div>
            );

            const ThrowingComponent = () => {
                throw new Error('Custom test error');
            };

            render(
                <ErrorBoundary fallback={customFallback}>
                    <ThrowingComponent />
                </ErrorBoundary>
            );

            expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
            expect(screen.getByText(/Custom error: Custom test error/)).toBeInTheDocument();
        });
    });

    describe('error recovery', () => {
        it('should have a reload button in default fallback', () => {
            const ThrowingComponent = () => {
                throw new Error('Test error');
            };

            render(
                <ErrorBoundary>
                    <ThrowingComponent />
                </ErrorBoundary>
            );

            const reloadButton = screen.getByRole('button', { name: /reload/i });
            expect(reloadButton).toBeInTheDocument();
        });

        it('should show error details in expandable section', () => {
            const ThrowingComponent = () => {
                const error = new Error('Test error');
                error.stack = 'Error: Test error\n    at ThrowingComponent';
                throw error;
            };

            render(
                <ErrorBoundary>
                    <ThrowingComponent />
                </ErrorBoundary>
            );

            const detailsElement = screen.getByText(/error details/i).closest('details');
            expect(detailsElement).toBeInTheDocument();
        });
    });
});
