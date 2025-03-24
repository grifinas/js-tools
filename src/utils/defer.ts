const promises: Promise<unknown>[] = [];
export function defer(promise: Promise<unknown>): void {
  promises.push(promise);
}

export async function settleDefferedPromises(): Promise<void> {
  const results = await Promise.allSettled(promises);
  const rejectedPromises = results.filter((item) => {
    return item.status === "rejected";
  });

  if (rejectedPromises.length > 0) {
    console.warn("Some promises were rejected", { promises: results });
  }
}
