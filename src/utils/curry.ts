export function curry<T extends (...args: any[]) => any>(
  fn: Function,
  thisContext: unknown,
  ...args: unknown[]
): T {
  const resFn = (...rargs: unknown[]) => {
    return fn.apply(thisContext, [...args, ...rargs]) as unknown as T;
  };

  return resFn as unknown as T;
}
