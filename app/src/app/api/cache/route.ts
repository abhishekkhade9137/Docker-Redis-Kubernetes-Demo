import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

// Simulates a slow database query
async function fakeDbQuery(key: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800)); // 800ms latency
  return `DB_VALUE::${key}::${Date.now()}`;
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') || 'default';
  const cacheKey = `cache:${key}`;
  const start = Date.now();

  try {
    // 1. Check Redis cache
    const cached = await redis.get(cacheKey);

    if (cached !== null) {
      return NextResponse.json({
        source: 'cache',
        key,
        value: cached,
        latencyMs: Date.now() - start,
        ttl: await redis.ttl(cacheKey),
      });
    }

    // 2. Cache miss — simulate DB query
    const value = await fakeDbQuery(key);

    // 3. Store in Redis with 30s TTL
    await redis.setex(cacheKey, 30, value);

    return NextResponse.json({
      source: 'database',
      key,
      value,
      latencyMs: Date.now() - start,
      ttl: 30,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Redis error', detail: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') || 'default';
  const cacheKey = `cache:${key}`;
  await redis.del(cacheKey);
  return NextResponse.json({ deleted: cacheKey });
}
