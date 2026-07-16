import { NextRequest } from "next/server";
import { ok, error, applyRateLimit } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/admin/reset
 * Same as POST /admin/analytics/reset — clears all analytics.
 */
export async function DELETE(request: NextRequest) {
  const limited = applyRateLimit(request, 5);
  if (limited) return limited;

  try {
    const orderItems = await db.orderItem.deleteMany({});
    const payments = await db.payment.deleteMany({});
    const orders = await db.order.deleteMany({});
    const transactions = await db.transaction.deleteMany({});
    const notifications = await db.notification.deleteMany({});
    const expenses = await db.expense.deleteMany({});
    const submissions = await db.paymentSubmission.deleteMany({});

    await db.product.updateMany({ data: { salesCount: 0, rating: 0, reviewCount: 0 } });
    await db.paymentGateway.updateMany({ data: { transactionCount: 0, totalVolume: 0 } });

    const cleared = {
      orders: orders.count,
      orderItems: orderItems.count,
      payments: payments.count,
      transactions: transactions.count,
      notifications: notifications.count,
      expenses: expenses.count,
      submissions: submissions.count,
    };

    return ok({ cleared, message: "All analytics data reset to 0." });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Reset failed", 500);
  }
}
