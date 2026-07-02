import { db } from "@/lib/db";
import { runSeed } from "@/lib/seed";

/**
 * Auto-seed guard: ensures the database has demo data (users, orders,
 * coupons, affiliates, notifications, settings) on first request.
 *
 * Note: The storefront shows ONLY products from your Lemon Squeezy store
 * (fetched live via the LS API). Seeded products remain in the DB for
 * analytics/admin demo data but NEVER appear on the storefront.
 */
let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const count = await db.user.count();
      if (count === 0) {
        await runSeed();
      }
    } catch (e) {
      seedPromise = null;
      console.error("[ensure-seed] failed:", e);
    }
  })();
  return seedPromise;
}
