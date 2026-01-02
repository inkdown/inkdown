/**
 * Application Error Hierarchy
 * 
 * Custom error types for consistent error handling across the application
 */

/**
 * Base application error class
 */
export class AppError extends Error {
    public readonly code: string;
    public readonly metadata?: Record<string, any>;

    constructor(message: string, code = 'APP_ERROR', metadata?: Record<string, any>) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.metadata = metadata;

        // Maintains proper stack trace for where error was thrown (V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * File system operation errors
 */
export class FileSystemError extends AppError {
    public readonly path: string;

    constructor(message: string, path: string, code = 'FILESYSTEM_ERROR') {
        super(message, code);
        this.name = 'FileSystemError';
        this.path = path;
    }
}

/**
 * Configuration errors
 */
export class ConfigError extends AppError {
    public readonly configKey: string;

    constructor(message: string, configKey: string, code = 'CONFIG_ERROR') {
        super(message, code);
        this.name = 'ConfigError';
        this.configKey = configKey;
    }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
    public readonly field: string;
    public readonly value: any;

    constructor(message: string, field: string, value: any, code = 'VALIDATION_ERROR') {
        super(message, code);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}

/**
 * Network/API errors
 */
export class NetworkError extends AppError {
    public readonly url: string;
    public readonly statusCode?: number;

    constructor(message: string, url: string, statusCode?: number, code = 'NETWORK_ERROR') {
        super(message, code);
        this.name = 'NetworkError';
        this.url = url;
        this.statusCode = statusCode;
    }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

/**
 * Convert any error-like value to AppError
 */
export function toAppError(error: unknown): AppError {
    // Already an AppError
    if (isAppError(error)) {
        return error;
    }

    // Regular Error
    if (error instanceof Error) {
        return new AppError(error.message, 'UNKNOWN_ERROR');
    }

    // String
    if (typeof error === 'string') {
        return new AppError(error, 'UNKNOWN_ERROR');
    }

    // Unknown type
    return new AppError(
        `Unknown error: ${JSON.stringify(error)}`,
        'UNKNOWN_ERROR'
    );
}
