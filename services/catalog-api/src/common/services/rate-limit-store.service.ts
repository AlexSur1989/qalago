import { HttpException, HttpStatus, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isProductionNodeEnv } from '../utils/production-config.util';

type MemoryEntry = { timestamps: number[] };

export interface RateLimitStore {
  assertAllowed(key: string, limit: number, windowMs: number): Promise<void>;
  recordHit(key: string, windowMs: number): Promise<void>;
  getRecentCount(key: string, windowMs: number): Promise<number>;
}

@Injectable()
export class RateLimitStoreService implements RateLimitStore, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitStoreService.name);
  private readonly memory = new Map<string, MemoryEntry>();
  private redis: import('ioredis').default | null = null;
  private redisInitAttempted = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  private async getRedis(): Promise<import('ioredis').default | null> {
    if (this.redisInitAttempted) {
      return this.redis;
    }
    this.redisInitAttempted = true;
    const url = this.config.get<string>('app.redisUrl', '')?.trim();
    if (!url) {
      return null;
    }
    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
      await this.redis.connect();
      this.logger.log('Rate limit store: Redis connected');
    } catch (err) {
      this.logger.warn(`Rate limit store: Redis unavailable, using in-memory fallback`);
      this.redis = null;
    }
    return this.redis;
  }

  async assertAllowed(key: string, limit: number, windowMs: number): Promise<void> {
    const count = await this.getRecentCount(key, windowMs);
    if (count >= limit) {
      throw new HttpException(
        { message: 'Too many requests', statusCode: HttpStatus.TOO_MANY_REQUESTS },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordHit(key: string, windowMs: number): Promise<void> {
    const redis = await this.getRedis();
    const now = Date.now();
    if (redis) {
      const redisKey = `rl:${key}`;
      const minScore = now - windowMs;
      const multi = redis.multi();
      multi.zremrangebyscore(redisKey, 0, minScore);
      multi.zadd(redisKey, now, `${now}:${Math.random()}`);
      multi.pexpire(redisKey, windowMs);
      await multi.exec();
      return;
    }

    if (isProductionNodeEnv(this.config.get<string>('NODE_ENV'))) {
      this.logger.warn('Rate limits using in-memory store in production (set REDIS_URL for distribution)');
    }

    let entry = this.memory.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.memory.set(key, entry);
    }
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    entry.timestamps.push(now);
  }

  async getRecentCount(key: string, windowMs: number): Promise<number> {
    const redis = await this.getRedis();
    const now = Date.now();
    if (redis) {
      const redisKey = `rl:${key}`;
      const minScore = now - windowMs;
      await redis.zremrangebyscore(redisKey, 0, minScore);
      return redis.zcard(redisKey);
    }

    const entry = this.memory.get(key);
    if (!entry) return 0;
    return entry.timestamps.filter((t) => now - t < windowMs).length;
  }
}
