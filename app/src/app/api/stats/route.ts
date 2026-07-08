import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function GET() {
  try {
    // Increment visit counter
    const visits = await redis.incr('stats:visits');

    // Get Redis INFO
    const info = await redis.info('all');
    const parse = (section: string, key: string): string => {
      const match = info.match(new RegExp(`${key}:(.+)`));
      return match ? match[1].trim() : 'N/A';
    };

    // Count cached keys
    const keys = await redis.keys('cache:*');

    return NextResponse.json({
      visits,
      cachedKeys: keys.length,
      keys,
      redis: {
        version: parse('server', 'redis_version'),
        uptimeSeconds: parse('server', 'uptime_in_seconds'),
        connectedClients: parse('clients', 'connected_clients'),
        usedMemory: parse('memory', 'used_memory_human'),
        totalCommandsProcessed: parse('stats', 'total_commands_processed'),
        keyspaceHits: parse('stats', 'keyspace_hits'),
        keyspaceMisses: parse('stats', 'keyspace_misses'),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Redis error', detail: String(err) },
      { status: 500 }
    );
  }
}
