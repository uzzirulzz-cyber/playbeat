import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Force-load .env so the Neon DATABASE_URL always wins over any stale
// shell environment variable. Must run before PrismaClient is constructed.
config({ path: '.env', override: true })

// Prisma client tuned for Neon's pooled connection (PgBouncer).
// - Small pool to avoid exhausting Neon's connection limit
// - Short timeouts so cold-start wakeups don't hang the request
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Neon auto-suspends idle compute, which can cause the first query after a
// pause to fail with a "Closed" / connection error. This helper retries the
// operation once on connection errors.
export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const isConnectionError =
      /closed|connection|timeout|epipe|read 0/i.test(msg)
    if (retries > 0 && isConnectionError) {
      // Brief pause then retry — Neon compute is warming up
      await new Promise((r) => setTimeout(r, 500))
      return withRetry(fn, retries - 1)
    }
    throw err
  }
}
