/**
 * Auto-seed guard.
 *
 * The storefront shows ONLY products from your Lemon Squeezy store (fetched
 * live via the LS API). Seeded products remain in the DB for analytics/admin
 * demo data but NEVER appear on the storefront.
 *
 * This function is wrapped in a resilient try/catch so DB connection issues
 * (e.g. Neon cold starts) never crash the server or block product fetching.
 */
let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const { db } = await import("@/lib/db");
      const { runSeed } = await import("@/lib/seed");
      const count = await db.user.count();
      if (count === 0) {
        await runSeed();
      }
    } catch (e) {
      // Reset so a later request can retry; never throw.
      seedPromise = null;
      console.error("[ensure-seed] skipped (non-fatal):", e);
    }
  })();
  return seedPromise;
}
