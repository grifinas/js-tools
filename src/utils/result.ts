export type Result<T, E = Error> = Ok<T> | Err<E>;

export class Ok<T> {
  constructor(private readonly value: T) {}

  isOk(): this is Ok<T> {
    return true;
  }

  isErr(): this is never {
    return false;
  }

  map<U>(fn: (value: T) => Promise<U>): AwaitedResult<U, any>;
  map<U>(fn: (value: T) => U): Result<U>;
  map<U>(fn: ((value: T) => U) | ((value: T) => Promise<U>)) {
    try {
      const result = fn(this.value);
      if (result instanceof Promise) {
        return AwaitedResult.fromPromise(result);
      }
      return new Ok(result);
    } catch (error) {
      return new Err(error);
    }
  }

  mapErr<F>(_fn: (error: never) => F): Result<T, F> {
    return this;
  }

  recover(_fn: Function): Ok<T> {
    return this;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  unwrapOrElse(_fn: (error: never) => T): T {
    return this.value;
  }
}

export class Err<E> {
  constructor(public readonly error: E) {}

  isOk(): this is never {
    return false;
  }

  isErr(): this is Err<E> {
    return true;
  }

  map<U>(_fn: (value: never) => U) {
    return this;
  }

  recover<T>(fn: (error: E) => T): Ok<T> {
    return new Ok<T>(fn(this.error));
  }

  mapErr<F>(fn: (error: E) => F): Result<never, F> {
    return new Err(fn(this.error));
  }

  unwrap(): never {
    throw new Error(`Called unwrap on an Err value: ${this.error}`);
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse<T>(fn: (error: E) => T): T {
    return fn(this.error);
  }
}

export class AwaitedResult<T, E = Error> {
  constructor(private promise: Promise<Result<T, E>>) {}

  static fromPromise<T>(promise: Promise<T>): AwaitedResult<T> {
    return new AwaitedResult(
      promise
        .then((r) => {
          if (r instanceof Ok || r instanceof Err) {
            return r;
          }
          return new Ok(r);
        })
        .catch((err) => {
          return new Err(err);
        }),
    );
  }

  map<U>(fn: (value: T) => U | Promise<U>) {
    //@ts-ignore
    const newPromise: Promise<Result<U>> = this.promise
      .then(async (result) => {
        return result.map(fn);
      })
      .catch((err) => new Err(err));

    return new AwaitedResult(newPromise);
  }

  mapErr<F>(fn: (error: E) => F) {
    const newPromise = this.promise.then((result) => {
      if (result.isOk()) {
        return result as any;
      }
      return new Err(fn(result.error));
    });

    return new AwaitedResult(newPromise);
  }

  recover<T>(fn: (error: E) => T): Ok<T> {
    throw new Error("Not implemented");
  }

  async unwrap(): Promise<T> {
    const result = await this.promise;
    return result.unwrap();
  }

  async unwrapOr(defaultValue: T): Promise<T> {
    const result = await this.promise;
    //@ts-ignore
    return result.unwrapOr(defaultValue);
  }

  async unwrapOrElse(fn: (error: E) => T): Promise<T> {
    const result = await this.promise;
    return result.unwrapOrElse(fn);
  }
}

// Helper functions
export function ok<T>(value: T): Ok<T> {
  return new Ok(value);
}

export function err<E>(error: E): Err<E> {
  return new Err(error);
}
