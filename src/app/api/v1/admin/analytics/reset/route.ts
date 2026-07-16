import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/admin/analytics/reset
 *
 * Resets ALL analytics data to zero. Deletes:
 *   - Orders + OrderItems
 *   - Payments
 *   - Transactions
 *   - Notifications
 *   - Expenses
 *   - Payment Submissions
 *
 * PRESERVES:
 *   - Products (29 PKR products)
 *   - Categories, Users, Coupons, Vendors
 *   - Payment Gateways config
 *   - IPTV channels/subscribers
 *   - CMS pages, blog posts, FAQs, sliders
 *   - Settings
 */
export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, 5);
  if (limited) return limited;

  try {
    // Delete in dependency order
    const orderItems = await db.orderItem.deleteMany({});
    const payments = await db.payment.deleteMany({});
    const orders = await db.order.deleteMany({});
    const transactions = await db.transaction.deleteMany({});
    const notifications = await db.notification.deleteMany({});
    const expenses = await db.expense.deleteMany({});
    const submissions = await db.paymentSubmission.deleteMany({});

    // Reset product counters
    await db.product.updateMany({
      data: { salesCount: 0, rating: 0, reviewCount: 0 },
    });

    // Reset payment gateway counters
    await db.paymentGateway.updateMany({
      data: { transactionCount: 0, totalVolume: 0 },
    });

    const cleared = {
      orders: orders.count,
      orderItems: orderItems.count,
      payments: payments.count,
      transactions: transactions.count,
      notifications: notifications.count,
      expenses: expenses.count,
      submissions: submissions.count,
    };

    console.log("[admin/reset] Full reset:", cleared);

    return ok({
      cleared,
      preserved: [
        "products", "categories", "users", "coupons", "vendors",
        "paymentGateways", "iptvChannels", "iptvSubscribers",
        "cmsPages", "blogPosts", "faqs", "sliders", "settings",
        "apiKeys", "webhooks", "integrations", "securitySettings",
      ],
      message: `Reset complete. Cleared ${orders.count} orders, ${payments.count} payments, ${expenses.count} expenses, ${notifications.count} notifications.`,
    });
  } catch (e) {
    console.error("[admin/reset] Failed:", e);
    return error(e instanceof Error ? e.message : "Reset failed", 500);
  }
}
