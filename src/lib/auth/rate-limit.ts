const attempts = new Map<string, number[]>();

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const recent = (attempts.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

export function resetRateLimit() {
  attempts.clear();
}
