export async function runWithConcurrency(items, worker, concurrency = 4) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runNext() {
    const current = cursor;
    cursor += 1;
    if (current >= items.length) return;
    results[current] = await worker(items[current], current);
    await runNext();
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runNext());
  await Promise.all(workers);
  return results;
}
