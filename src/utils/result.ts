type Result<T, E> = Ok<T, E> | Err<T, E>;

class Ok<T, E> {
  readonly type = "ok" as const;

  constructor(public readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_default: T): T {
    return this.value;
  }
}

class Err<T, E> {
  readonly type = "err" as const;

  constructor(public readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  unwrap(): T {
    throw new Error(`Tried to unwrap Err: ${this.error}`);
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }
}

// Helpers
function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok(value);
}

function err<T = never, E = unknown>(error: E): Result<T, E> {
  return new Err(error);
}
