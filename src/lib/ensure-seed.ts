import { db } from "@/lib/db";
import { runSeed } from "@/lib/seed";

/**
 * Ensures the database has seed data. Idempotent — only seeds if the DB
 * has no products. Safe to call on every request.
 *
 * Previously this was a no-op (the storefront was LS-only). Now that we
 * support DB-backed products too, we need the seed to run at least once
 * so the storefront isn't empty when Lemon Squeezy isn't configured.
 */
let seedPromise: Promise<void> | null = null;
let seeded = false;

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      // Only seed if the DB has no products
      const count = await db.product.count();
      if (count === 0) {
        console.log("[ensure-seed] DB is empty — running seed…");
        await runSeed();
        console.log("[ensure-seed] Seed complete.");
      }
      seeded = true;
    } catch (e) {
      // DB connection issues (Neon cold starts) — non-fatal.
      // The storefront will fall back to catalog/LS products.
      console.error("[ensure-seed] failed (non-fatal):", e);
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}
