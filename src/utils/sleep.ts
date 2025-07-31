export function sleep(millis: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}
