import { redisKey } from "@watchsync/shared/redis-key";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
export const redis = Redis.fromEnv();
export const createLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: redisKey("create"),
});
export const searchLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: redisKey("search"),
});
export const passwordLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: redisKey("password"),
});
