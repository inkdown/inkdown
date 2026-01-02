/**
 * Result Type
 * 
 * Functional error handling inspired by Rust's Result<T, E>
 * Represents either success (Ok) or failure (Err)
 */

/**
 * Result type - either Ok<T> or Err<E>
 */
export type Result<T, E> = OkClass<T, E> | ErrClass<T, E>;

/**
 * Success variant containing a value
 */
class OkClass<T, E> {
    readonly _tag = 'Ok' as const;
    
    constructor(private readonly value: T) {}

    isOk(): this is OkClass<T, E> {
        return true;
    }

    isErr(): this is ErrClass<T, E> {
        return false;
    }

    unwrap(): T {
        return this.value;
    }

    unwrapOr(_defaultValue: T): T {
        return this.value;
    }

    unwrapOrElse(_fn: (error: E) => T): T {
        return this.value;
    }

    expect(_message: string): T {
        return this.value;
    }

    map<U>(fn: (value: T) => U): Result<U, E> {
        return new OkClass(fn(this.value));
    }

    mapErr<F>(_fn: (error: E) => F): Result<T, F> {
        return new OkClass(this.value);
    }

    andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return fn(this.value);
    }

    orElse<F>(_fn: (error: E) => Result<T, F>): Result<T, F> {
        return new OkClass(this.value);
    }

    match<U>(okFn: (value: T) => U, _errFn: (error: E) => U): U {
        return okFn(this.value);
    }

    ok(): T | undefined {
        return this.value;
    }

    err(): E | undefined {
        return undefined;
    }
}

/**
 * Error variant containing an error
 */
class ErrClass<T, E> {
    readonly _tag = 'Err' as const;
    
    constructor(private readonly error: E) {}

    isOk(): this is OkClass<T, E> {
        return false;
    }

    isErr(): this is ErrClass<T, E> {
        return true;
    }

    unwrap(): T {
        throw this.error;
    }

    unwrapOr(defaultValue: T): T {
        return defaultValue;
    }

    unwrapOrElse(fn: (error: E) => T): T {
        return fn(this.error);
    }

    expect(message: string): T {
        throw new Error(`${message}: ${this.error}`);
    }

    map<U>(_fn: (value: T) => U): Result<U, E> {
        return new ErrClass(this.error);
    }

    mapErr<F>(fn: (error: E) => F): Result<T, F> {
        return new ErrClass(fn(this.error));
    }

    andThen<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
        return new ErrClass(this.error);
    }

    orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F> {
        return fn(this.error);
    }

    match<U>(_okFn: (value: T) => U, errFn: (error: E) => U): U {
        return errFn(this.error);
    }

    ok(): T | undefined {
        return undefined;
    }

    err(): E | undefined {
        return this.error;
    }
}

/**
 * Factory function to create Ok result
 */
export function Ok<T, E = never>(value: T): Result<T, E> {
    return new OkClass(value);
}

/**
 * Factory function to create Err result
 */
export function Err<T = never, E = unknown>(error: E): Result<T, E> {
    return new ErrClass(error);
}

/**
 * Helper function to convert a Promise to a Result
 */
export async function fromPromise<T, E = Error>(
    promise: Promise<T>
): Promise<Result<T, E>> {
    try {
        const value = await promise;
        return Ok(value);
    } catch (error) {
        return Err(error as E);
    }
}

/**
 * Helper function to wrap a potentially throwing function
 */
export function tryCatch<T, E = Error>(
    fn: () => T
): Result<T, E> {
    try {
        return Ok(fn());
    } catch (error) {
        return Err(error as E);
    }
}

/**
 * Helper function to wrap an async function
 */
export async function tryCatchAsync<T, E = Error>(
    fn: () => Promise<T>
): Promise<Result<T, E>> {
    try {
        const value = await fn();
        return Ok(value);
    } catch (error) {
        return Err(error as E);
    }
}
