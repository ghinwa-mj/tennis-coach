import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

export const VISITOR_DAILY_LIMIT = 25;
export const GLOBAL_DAILY_LIMIT = 200;
export const VISITOR_COOKIE = 'tc_vid';

export type RateLimitResult =
  | { ok: true; visitorId: string; setCookie: boolean }
  | {
      ok: false;
      visitorId: string;
      setCookie: boolean;
      status: 429 | 503;
      error: string;
      code: 'visitor_limit' | 'global_limit' | 'rate_limit_unavailable';
    };

function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function getRedis(): Redis | null {
  if (!redisConfigured()) return null;
  return Redis.fromEnv();
}

function getLimiters(redis: Redis) {
  const visitorLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(VISITOR_DAILY_LIMIT, '1 d'),
    prefix: 'tc-visitor',
    analytics: false,
  });

  const globalLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(GLOBAL_DAILY_LIMIT, '1 d'),
    prefix: 'tc-global',
    analytics: false,
  });

  return { visitorLimiter, globalLimiter };
}

export function getOrCreateVisitorId(request: NextRequest): {
  visitorId: string;
  setCookie: boolean;
} {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value?.trim();
  if (existing && existing.length >= 8 && existing.length <= 80) {
    return { visitorId: existing, setCookie: false };
  }
  return { visitorId: crypto.randomUUID(), setCookie: true };
}

/**
 * Enforce anonymous per-visitor + global daily caps before calling Claude.
 * No sign-in required — identity is a first-party cookie.
 *
 * Local/dev without Upstash: allows requests (with a warning).
 * Production without Upstash: blocks to avoid unbounded spend.
 */
export async function enforceChatRateLimit(
  request: NextRequest
): Promise<RateLimitResult> {
  const { visitorId, setCookie } = getOrCreateVisitorId(request);
  const redis = getRedis();

  if (!redis) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        'Rate limiting unavailable: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing'
      );
      return {
        ok: false,
        visitorId,
        setCookie,
        status: 503,
        code: 'rate_limit_unavailable',
        error:
          'Demo rate limiting is not configured. Chat is temporarily unavailable.',
      };
    }
    console.warn(
      'Skipping chat rate limits (Upstash Redis env vars not set). Local/dev only.'
    );
    return { ok: true, visitorId, setCookie };
  }

  const { visitorLimiter, globalLimiter } = getLimiters(redis);

  const visitor = await visitorLimiter.limit(visitorId);
  if (!visitor.success) {
    return {
      ok: false,
      visitorId,
      setCookie,
      status: 429,
      code: 'visitor_limit',
      error: `You've reached today's demo limit (${VISITOR_DAILY_LIMIT} messages). Thanks for trying TennisCoach AI — come back tomorrow!`,
    };
  }

  const global = await globalLimiter.limit('all');
  if (!global.success) {
    return {
      ok: false,
      visitorId,
      setCookie,
      status: 429,
      code: 'global_limit',
      error: `The public demo has hit today's shared limit (${GLOBAL_DAILY_LIMIT} messages). Please try again tomorrow!`,
    };
  }

  return { ok: true, visitorId, setCookie };
}

export function applyVisitorCookie(
  response: NextResponse,
  visitorId: string,
  setCookie: boolean
): NextResponse {
  if (setCookie) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
