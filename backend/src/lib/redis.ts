import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisOptions: Record<string, unknown> = {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
};

if (REDIS_URL.startsWith("rediss://")) {
  redisOptions.tls = { rejectUnauthorized: false };
}

export const redis = new Redis(REDIS_URL, redisOptions);

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

export default redis;

