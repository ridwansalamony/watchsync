export function redisKey(suffix: string) {
  const namespace = process.env.REDIS_NAMESPACE ?? "wsr";
  if (!/^[a-zA-Z0-9:_-]{1,64}$/.test(namespace))
    throw new Error("REDIS_NAMESPACE tidak valid.");
  return `${namespace}:${suffix}`;
}
