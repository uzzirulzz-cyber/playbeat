import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 5);
  if (limited) return limited;

  try {
    const cleared: any = {};

    // Delete each collection with try/catch — one failure shouldn't break the rest
    try { const r = await db.orderItem.deleteMany({}); cleared.orderItems = r.count; } catch (e) { cleared.orderItems = 0; console.error("[reset] orderItem:", e); }
    try { const r = await db.payment.deleteMany({}); cleared.payments = r.count; } catch (e) { cleared.payments = 0; console.error("[reset] payment:", e); }
    try { const r = await db.order.deleteMany({}); cleared.orders = r.count; } catch (e) { cleared.orders = 0; console.error("[reset] order:", e); }
    try { const r = await db.transaction.deleteMany({}); cleared.transactions = r.count; } catch (e) { cleared.transactions = 0; console.error("[reset] transaction:", e); }
    try { const r = await db.notification.deleteMany({}); cleared.notifications = r.count; } catch (e) { cleared.notifications = 0; console.error("[reset] notification:", e); }
    try { const r = await db.expense.deleteMany({}); cleared.expenses = r.count; } catch (e) { cleared.expenses = 0; console.error("[reset] expense:", e); }
    try { const r = await db.paymentSubmission.deleteMany({}); cleared.submissions = r.count; } catch (e) { cleared.submissions = 0; console.error("[reset] paymentSubmission:", e); }

    // Reset product counters
    try { await db.product.updateMany({ data: { salesCount: 0, rating: 0, reviewCount: 0 } }); } catch (e) { console.error("[reset] product update:", e); }

    // Reset payment gateway counters
    try { await db.paymentGateway.updateMany({ data: { transactionCount: 0, totalVolume: 0 } }); } catch (e) { console.error("[reset] gateway update:", e); }

    return ok({
      cleared,
      preserved: ["products", "categories", "users", "coupons", "vendors", "paymentGateways", "iptvChannels", "settings"],
      message: `Reset complete. Cleared ${cleared.orders || 0} orders, ${cleared.payments || 0} payments, ${cleared.expenses || 0} expenses.`,
    });
  } catch (e) {
    console.error("[admin/reset] Failed:", e);
    return error(e instanceof Error ? e.message : "Reset failed", 500);
  }
}
