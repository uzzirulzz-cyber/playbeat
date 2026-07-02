/**
 * Auto-seed guard.
 *
 * The storefront shows ONLY products from your Lemon Squeezy store (fetched
 * live via the LS API). We do NOT seed random products into the database —
 * only what you list in Lemon Squeezy appears on the storefront.
 *
 * This function is kept as a no-op so existing API routes that call
 * ensureSeeded() still work without error, but no demo products are ever
 * created.
 */
export async function ensureSeeded(): Promise<void> {
  // Intentionally empty — no random products.
  return;
}
