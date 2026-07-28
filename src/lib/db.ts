import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Force-load .env so the Neon DATABASE_URL always wins over any stale
// shell environment variable. Must run before PrismaClient is constructed.
config({ path: '.env', override: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
