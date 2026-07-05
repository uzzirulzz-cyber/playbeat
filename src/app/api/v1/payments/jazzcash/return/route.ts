import { NextRequest, NextResponse } from "next/server";
import { parseCallback } from "@/lib/jazzcash";
import { db } from "@/lib/db";

/**
 * GET/POST /api/v1/payments/jazzcash/return
 *
 * The customer is redirected here after completing (or cancelling) payment
 * on the JazzCash payment page. We:
 *   1. Read the callback params
 *   2. Verify the signature
 *   3. Update the order status in the DB (if we can find the order)
 *   4. Redirect to the storefront with payment status + order details
 *
 * The redirect URL uses the request's own origin so it always goes back
 * to the correct storefront domain.
 */
async function handleReturn(params: Record<string, string>, requestUrl: string) {
  const result = parseCallback(params);

  // JazzCash response codes: 000 = success, others = failure
  const isSuccess = result.verified && result.status === "000";

  // Try to update the order in the DB based on pp_BillReference (order number)
  const billRef = params.pp_BillReference || result.billReference;
  if (billRef) {
    try {
      const order = await db.order.findFirst({
        where: { orderNumber: billRef },
        include: { items: { include: { product: true } }, payment: true },
      });

      if (order) {
        // Update order status
        await db.order.update({
          where: { id: order.id },
          data: { status: isSuccess ? "COMPLETED" : "CANCELLED" },
        });

        // Update payment record
        const payment = await db.payment.findUnique({
          where: { orderId: order.id },
        }).catch(() => null);

        if (payment) {
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: isSuccess ? "COMPLETED" : "FAILED",
              transactionId: result.txnRefNo || payment.transactionId,
            },
          });
        }

        console.log(`[jazzcash-return] order ${billRef} → ${isSuccess ? "COMPLETED" : "CANCELLED"}`);
      }
    } catch (dbErr) {
      // Non-fatal — don't block the redirect
      console.error("[jazzcash-return] DB update failed (non-fatal):", dbErr);
    }
  }

  // Build redirect URL from the request's own origin
  const origin = new URL(requestUrl).origin;
  const statusParam = isSuccess ? "success" : "failed";
  const msgParam = encodeURIComponent(result.message || (isSuccess ? "Payment successful" : "Payment failed"));

  const redirectUrl = new URL(`/?payment=${statusParam}&ref=${result.txnRefNo}&msg=${msgParam}`, origin);

  // Add order number if we have it
  if (billRef) {
    redirectUrl.searchParams.set("order", billRef);
  }

  // Add extended response fields if available
  if (result.retrievalReferenceNo) {
    redirectUrl.searchParams.set("rrn", result.retrievalReferenceNo);
  }
  if (result.amount) {
    redirectUrl.searchParams.set("amount", String(result.amount));
  }
  if (result.currency) {
    redirectUrl.searchParams.set("currency", result.currency);
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}

export async function GET(request: NextRequest) {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((v, k) => {
    params[k] = String(v);
  });
  return handleReturn(params, request.url);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((v, k) => {
    params[k] = String(v);
  });
  return handleReturn(params, request.url);
}
