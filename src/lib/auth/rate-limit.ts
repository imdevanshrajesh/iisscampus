const attempts = new Map<string, number[]>();

function recentAttempts(key: string, windowMs: number, now: number) {
  const recent = (attempts.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length) attempts.set(key, recent);
  else attempts.delete(key);
  return recent;
}

export function rateLimitAllows(key: string, limit: number, windowMs: number, now = Date.now()) {
  return recentAttempts(key, windowMs, now).length < limit;
}

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const recent = recentAttempts(key, windowMs, now);
  if (recent.length >= limit) return false;
  recent.push(now);
  attempts.set(key, recent);
  return true;
}

export function resetRateLimit() {
  attempts.clear();
}
