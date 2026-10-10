import { config } from 'dotenv';
config();

import { Redis } from 'ioredis';

// Connects to local Redis by default, or you can configure a hosted Redis URL
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  keepAlive: 10000, // Send keep-alive every 10s to prevent Upstash from closing idle connections
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});
