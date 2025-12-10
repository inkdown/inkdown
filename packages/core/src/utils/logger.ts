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
    debug(msg: string, ...args: unknown[]): void;
    info(msg: string, ...args: unknown[]): void;
    warn(msg: string, ...args: unknown[]): void;
    error(msg: string, error?: unknown, ...args: unknown[]): void;
    child(bindings: Record<string, unknown>): Logger;
}

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string): Logger {
    const logger = baseLogger.child({ module });

    return {
        debug: (msg: string, ...args: unknown[]) => {
            logger.debug({ ...args }, msg);
        },
        info: (msg: string, ...args: unknown[]) => {
            logger.info({ ...args }, msg);
        },
        warn: (msg: string, ...args: unknown[]) => {
            logger.warn({ ...args }, msg);
        },
        error: (msg: string, error?: unknown, ...args: unknown[]) => {
            if (error instanceof Error) {
                logger.error({ err: error, ...args }, msg);
            } else {
                logger.error({ error, ...args }, msg);
            }
        },
        child: (bindings: Record<string, unknown>) => {
            const childLogger = logger.child(bindings);
            // Return a new logger wrapper with the child logger
            return createLoggerFromPino(childLogger, module);
        },
    };
}

/**
 * Internal helper to create logger from existing pino instance
 */
function createLoggerFromPino(pinoLogger: pino.Logger, _module: string): Logger {
    return {
        debug: (msg: string, ...args: unknown[]) => {
            pinoLogger.debug({ ...args }, msg);
        },
        info: (msg: string, ...args: unknown[]) => {
            pinoLogger.info({ ...args }, msg);
        },
        warn: (msg: string, ...args: unknown[]) => {
            pinoLogger.warn({ ...args }, msg);
        },
        error: (msg: string, error?: unknown, ...args: unknown[]) => {
            if (error instanceof Error) {
                pinoLogger.error({ err: error, ...args }, msg);
            } else {
                pinoLogger.error({ error, ...args }, msg);
            }
        },
        child: (bindings: Record<string, unknown>) => {
            return createLoggerFromPino(pinoLogger.child(bindings), _module);
        },
    };
}

/**
 * Pre-configured loggers for common modules
 */
export const loggers = {
    app: createLogger('App'),
    plugin: createLogger('PluginManager'),
    theme: createLogger('ThemeManager'),
    config: createLogger('ConfigManager'),
    shortcuts: createLogger('ShortcutManager'),
    tabs: createLogger('TabManager'),
    workspace: createLogger('Workspace'),
    fileSystem: createLogger('FileSystemManager'),
    fontManager: createLogger('FontManager'),
    editorState: createLogger('EditorStateManager'),
    sync: createLogger('SyncManager'),
};

/**
 * Export base logger for custom usage
 */
export { baseLogger };
