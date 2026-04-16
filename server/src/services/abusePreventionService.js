const hitMap = new Map();

const now = () => Date.now();

export const checkOtpAbuse = ({ phone, ip, deviceId = "unknown" }) => {
  const key = `${phone}:${ip}:${deviceId}`;
  const current = hitMap.get(key) || { count: 0, resetAt: now() + 10 * 60 * 1000 };

  if (current.resetAt < now()) {
    const fresh = { count: 1, resetAt: now() + 10 * 60 * 1000 };
    hitMap.set(key, fresh);
    return { blocked: false, remaining: 5 - fresh.count };
  }

  current.count += 1;
  hitMap.set(key, current);

  if (current.count > 5) {
    return { blocked: true, retryAfterMs: current.resetAt - now() };
  }

  return { blocked: false, remaining: 5 - current.count };
};
