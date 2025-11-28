import pino from 'pino';

/**
 * Centralized logger using Pino
 * Provides structured logging with levels and context
 */

// Create base logger
const baseLogger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    browser: {
        asObject: true,
        serialize: true,
    },
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
});

/**
 * Logger interface for different modules
 */
export interface Logger {
    debug(msg: string, ...args: any[]): void;
    info(msg: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    error(msg: string, error?: any, ...args: any[]): void;
    child(bindings: Record<string, any>): Logger;
}

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string): Logger {
    const logger = baseLogger.child({ module });

    return {
        debug: (msg: string, ...args: any[]) => {
            logger.debug({ ...args }, msg);
        },
        info: (msg: string, ...args: any[]) => {
            logger.info({ ...args }, msg);
        },
        warn: (msg: string, ...args: any[]) => {
            logger.warn({ ...args }, msg);
        },
        error: (msg: string, error?: any, ...args: any[]) => {
            if (error instanceof Error) {
                logger.error({ err: error, ...args }, msg);
            } else {
                logger.error({ error, ...args }, msg);
            }
        },
        child: (bindings: Record<string, any>) => {
            const childLogger = logger.child(bindings);
            // Return a new logger wrapper with the child logger
            return createLoggerFromPino(childLogger, module);
        },
    };
}

/**
 * Internal helper to create logger from existing pino instance
 */
function createLoggerFromPino(pinoLogger: pino.Logger, module: string): Logger {
    return {
        debug: (msg: string, ...args: any[]) => {
            pinoLogger.debug({ ...args }, msg);
        },
        info: (msg: string, ...args: any[]) => {
            pinoLogger.info({ ...args }, msg);
        },
        warn: (msg: string, ...args: any[]) => {
            pinoLogger.warn({ ...args }, msg);
        },
        error: (msg: string, error?: any, ...args: any[]) => {
            if (error instanceof Error) {
                pinoLogger.error({ err: error, ...args }, msg);
            } else {
                pinoLogger.error({ error, ...args }, msg);
            }
        },
        child: (bindings: Record<string, any>) => {
            return createLoggerFromPino(pinoLogger.child(bindings), module);
        },
    };
}

/**
 * Pre-configured loggers for common modules
 */
export const loggers = {
    app: createLogger('App'),
    plugin: createLogger('PluginManager'),
    config: createLogger('ConfigManager'),
    editor: createLogger('EditorStateManager'),
    theme: createLogger('ThemeManager'),
    tab: createLogger('TabManager'),
    fs: createLogger('FileSystem'),
};

/**
 * Export base logger for custom usage
 */
export { baseLogger };
