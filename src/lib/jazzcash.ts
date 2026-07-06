import crypto from "crypto";

/**
 * JazzCash Payment Gateway Integration.
 *
 * Uses JazzCash's HTTP POST (Page Redirection) flow — the customer is
 * redirected to the JazzCash payment page via a POST form submission.
 *
 * Required env vars:
 *   JAZZCASH_MERCHANT_ID
 *   JAZZCASH_PASSWORD
 *   JAZZCASH_INTEGRITY_SALT   (hash key)
 *   JAZZCASH_RETURN_URL
 *   JAZZCASH_SANDBOX          (true for sandbox, false for live)
 */

// JazzCash sandbox + live gateway URLs (Page Redirection / merchantform)
const SANDBOX_URL =
  "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
const LIVE_URL =
  "https://seeds.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

export function isJazzCashConfigured(): boolean {
  return Boolean(
    process.env.JAZZCASH_MERCHANT_ID &&
      process.env.JAZZCASH_PASSWORD &&
      process.env.JAZZCASH_INTEGRITY_SALT,
  );
}

function getGatewayUrl(): string {
  return process.env.JAZZCASH_SANDBOX === "true" ? SANDBOX_URL : LIVE_URL;
}

/** Generate a unique transaction reference number (20 alphanumeric chars). */
export function generateTxnRefNo(): string {
  const ts = Date.now().toString();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ref = `T${ts.slice(-13)}${rand}`;
  return ref.slice(0, 20);
}

/**
 * Compute the HMAC-SHA256 secure hash for JazzCash.
 *
 * JazzCash expects: collect all pp_ and ppmpf_ parameters (excluding
 * pp_SecureHash), sort alphabetically by name, skip empty values, join
 * values with '&', prepend the integrity salt + '&', then HMAC-SHA256.
 */
export function computeSecureHash(
  params: Record<string, string>,
  salt: string,
): string {
  // Sort keys alphabetically, exclude pp_SecureHash, skip empty values
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== "pp_SecureHash")
    .sort();

  // Build the string: salt&val1&val2&val3... (only non-empty values)
  const nonEmptyValues: string[] = [salt];
  for (const key of sortedKeys) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== "") {
      nonEmptyValues.push(val);
    }
  }
  const data = nonEmptyValues.join("&");

  return crypto
    .createHmac("sha256", salt)
    .update(data, "utf8")
    .digest("hex")
    .toUpperCase();
}

/** Verify the secure hash returned by JazzCash in the callback. */
export function verifySecureHash(
  params: Record<string, string>,
  salt: string,
  receivedHash: string,
): boolean {
  const computed = computeSecureHash(params, salt);
  return computed === receivedHash;
}

export interface JazzCashPaymentParams {
  txnRefNo: string;
  amount: number; // in PKR rupees (will be converted to paisa)
  description: string;
  billReference: string;
  customerEmail?: string;
  customerMobile?: string;
  returnUrl?: string; // explicit return URL — overrides .env
}

/** Build the full parameter set for a JazzCash transaction request. */
export function buildTransactionParams(
  payment: JazzCashPaymentParams,
): { params: Record<string, string>; gatewayUrl: string } {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID!;
  const password = process.env.JAZZCASH_PASSWORD!;
  const salt = process.env.JAZZCASH_INTEGRITY_SALT!;
  // Use explicit returnUrl if provided, otherwise fall back to .env
  const returnUrl =
    payment.returnUrl ||
    process.env.JAZZCASH_RETURN_URL ||
    "https://playbeat.digital/api/v1/payments/jazzcash/return";

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const txnDateTime =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const txnExpiryDateTime =
    `${expiry.getFullYear()}${pad(expiry.getMonth() + 1)}${pad(expiry.getDate())}` +
    `${pad(expiry.getHours())}${pad(expiry.getMinutes())}${pad(expiry.getSeconds())}`;

  // Build params matching the JazzCash Page Redirection form exactly.
  // IMPORTANT: Do NOT include pp_BankID, pp_ProductID, pp_CNIC, pp_Email,
  // or pp_MobileNumber — they cause hash mismatch with JazzCash sandbox.
  // Empty-string fields are sent in the form but excluded from the hash
  // (computeSecureHash skips empty values).
  const params: Record<string, string> = {
    pp_Version: "1.1",
    pp_Language: "EN",
    pp_MerchantID: merchantId,
    pp_SubMerchantID: "",
    pp_Password: password,
    pp_TxnRefNo: payment.txnRefNo,
    pp_Amount: String(Math.round(payment.amount * 100)), // paisa
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: txnDateTime,
    pp_TxnExpiryDateTime: txnExpiryDateTime,
    pp_BillReference: payment.billReference,
    pp_Description: payment.description,
    pp_ReturnURL: returnUrl,
    ppmpf_1: "1",
    ppmpf_2: "2",
    ppmpf_3: "3",
    ppmpf_4: "4",
    ppmpf_5: "5",
  };

  // Compute and append the secure hash
  params.pp_SecureHash = computeSecureHash(params, salt);

  return { params, gatewayUrl: getGatewayUrl() };
}

/** Parse the JazzCash callback and verify the signature. */
export function parseCallback(
  query: Record<string, string>,
): {
  verified: boolean;
  txnRefNo: string;
  status: string;
  amount: number | null;
  message: string;
} {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT || "";
  const receivedHash = query.pp_SecureHash || "";

  const verified = verifySecureHash(query, salt, receivedHash);

  const amountStr = query.pp_Amount;
  const amount = amountStr ? parseInt(amountStr, 10) / 100 : null;

  return {
    verified,
    txnRefNo: query.pp_TxnRefNo || "",
    status: query.pp_ResponseCode || "",
    amount,
    message: query.pp_ResponseMessage || "",
  };
}
