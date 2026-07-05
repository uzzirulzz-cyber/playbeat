"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Settings,
  ExternalLink,
  RefreshCw,
  Phone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function AdminJazzCash() {
  const [testAmount, setTestAmount] = React.useState("100");
  const [testLoading, setTestLoading] = React.useState(false);
  const [merchantId, setMerchantId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [salt, setSalt] = React.useState("");
  const [sandbox, setSandbox] = React.useState(true);

  const handleTestPayment = async () => {
    setTestLoading(true);
    try {
      const result = await api.jazzcashCreate({
        amount: Number(testAmount),
        description: "Test payment from PlayBeat admin",
        billReference: `TEST-${Date.now()}`,
      });
      // Build a form and submit to the JazzCash gateway
      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.gatewayUrl;
      for (const [key, value] of Object.entries(result.params)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      toast.success(`Redirecting to JazzCash ${result.sandbox ? "sandbox" : "live"}...`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "JazzCash not configured");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-red-600 to-orange-600 shadow-lg">
          <Smartphone className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">JazzCash</h1>
          <p className="text-sm text-muted-foreground">
            Live Pakistani payment gateway — accept JazzCash wallet, card, and bank transfers
          </p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-red-500/15">
              <CreditCard className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gateway</p>
              <p className="font-bold">JazzCash</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-amber-500/15">
              <Settings className="size-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mode</p>
              <p className="font-bold">{sandbox ? "Sandbox" : "Live"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="grid size-10 place-items-center rounded-lg bg-green-500/15">
              <Phone className="size-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Currency</p>
              <p className="font-bold">PKR (Pakistani Rupee)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4" /> Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Merchant ID</Label>
              <Input
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="MCxxxxx"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="xxxxxx"
                className="border-white/10 bg-white/5"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Integrity Salt (Hash Key)</Label>
            <Input
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="border-white/10 bg-white/5"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
            <div>
              <p className="text-sm font-medium">Sandbox Mode</p>
              <p className="text-xs text-muted-foreground">
                Test with JazzCash sandbox before going live
              </p>
            </div>
            <Switch checked={sandbox} onCheckedChange={setSandbox} />
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs font-medium text-amber-400">
              ⚙️ To activate, add these to your <code>.env</code> file:
            </p>
            <pre className="mt-2 overflow-x-auto text-[10px] text-muted-foreground">
{`JAZZCASH_MERCHANT_ID=${merchantId || "your_merchant_id"}
JAZZCASH_PASSWORD=${password ? "***" : "your_password"}
JAZZCASH_INTEGRITY_SALT=${salt ? "***" : "your_salt"}
JAZZCASH_SANDBOX=${sandbox ? "true" : "false"}
JAZZCASH_RETURN_URL=https://playbeat.live/api/v1/payments/jazzcash/return
JAZZCASH_POSTBACK_URL=https://playbeat.live/api/v1/payments/jazzcash/webhook`}
            </pre>
          </div>
          <Button
            className="w-full"
            onClick={() => toast.message("Save the .env vars and restart the server to activate")}
          >
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Test payment */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4" /> Test Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Initiate a test transaction to verify your JazzCash integration.
            You&apos;ll be redirected to the JazzCash payment page.
          </p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Rs
              </span>
              <Input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="border-white/10 bg-white/5 pl-9"
                placeholder="100"
              />
            </div>
            <Button
              onClick={handleTestPayment}
              disabled={testLoading || !testAmount}
              className="gap-2"
            >
              {testLoading ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              Test Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration URLs */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base">Integration URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Return URL (Redirect)", url: "https://playbeat.live/api/v1/payments/jazzcash/return" },
            { label: "Postback URL (IPN Webhook)", url: "https://playbeat.live/api/v1/payments/jazzcash/webhook" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/5 p-3">
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <code className="mt-1 block break-all text-xs text-blue-400">
                {item.url}
              </code>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          "JazzCash Wallet",
          "Debit/Credit Cards",
          "Bank Transfer",
          "Mobile Balance",
        ].map((f) => (
          <Card key={f} className="border-white/10 bg-white/5">
            <CardContent className="flex items-center gap-2 p-3">
              <CheckCircle2 className="size-4 text-green-400" />
              <span className="text-xs font-medium">{f}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Response Codes from PDF v3.9 Appendix I */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base">Gateway Response Codes (Official PDF v3.9)</CardTitle>
          <p className="text-xs text-slate-300">
            Complete list from JazzCash Integration Guide Appendix I — 50+ codes
          </p>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto rounded border border-white/10 pb-scrollbar">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-black/60 text-left text-slate-300">
                <tr>
                  <th className="p-1.5 font-semibold">Code</th>
                  <th className="p-1.5 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  { code: "000", desc: "Transaction successful", color: "text-green-400" },
                  { code: "001", desc: "Limit exceeded", color: "text-amber-400" },
                  { code: "002", desc: "Account not found", color: "text-red-400" },
                  { code: "003", desc: "Account inactive", color: "text-red-400" },
                  { code: "004", desc: "Low balance", color: "text-amber-400" },
                  { code: "014", desc: "Warm card", color: "text-red-400" },
                  { code: "015", desc: "Hot card", color: "text-red-400" },
                  { code: "016", desc: "Invalid card status", color: "text-red-400" },
                  { code: "024", desc: "Bad PIN", color: "text-red-400" },
                  { code: "055", desc: "Host link down", color: "text-red-400" },
                  { code: "058", desc: "Transaction timed out", color: "text-amber-400" },
                  { code: "059", desc: "Transaction rejected by host", color: "text-red-400" },
                  { code: "060", desc: "PIN retries exhausted", color: "text-red-400" },
                  { code: "062", desc: "Host offline", color: "text-red-400" },
                  { code: "063", desc: "Destination not found", color: "text-red-400" },
                  { code: "066", desc: "No transactions allowed", color: "text-red-400" },
                  { code: "067", desc: "Invalid account status", color: "text-red-400" },
                  { code: "095", desc: "Transaction rejected", color: "text-red-400" },
                  { code: "101", desc: "Invalid merchant credentials", color: "text-red-400" },
                  { code: "102", desc: "Card blocked", color: "text-red-400" },
                  { code: "103", desc: "Customer blocked", color: "text-red-400" },
                  { code: "104", desc: "BIN not allowed for use on merchant", color: "text-red-400" },
                  { code: "105", desc: "Transaction exceeds merchant per transaction limit", color: "text-amber-400" },
                  { code: "106", desc: "Transaction exceeds per transaction limit for card", color: "text-amber-400" },
                  { code: "107", desc: "Transaction exceeds cycle limit for card", color: "text-amber-400" },
                  { code: "108", desc: "Authorization of customer registration required", color: "text-amber-400" },
                  { code: "109", desc: "Transaction does not exist", color: "text-amber-400" },
                  { code: "110", desc: "Invalid value for field", color: "text-red-400" },
                  { code: "111", desc: "Transaction not allowed on Merchant/Bank", color: "text-red-400" },
                  { code: "112", desc: "Transaction Cancelled by User", color: "text-amber-400" },
                  { code: "113", desc: "Transaction settlement period lapsed", color: "text-amber-400" },
                  { code: "115", desc: "Invalid hash received", color: "text-red-400" },
                  { code: "116", desc: "Transaction Expired", color: "text-amber-400" },
                  { code: "117", desc: "Transaction not allowed on Sub Merchant", color: "text-red-400" },
                  { code: "118", desc: "Transaction not allowed due to maintenance", color: "text-amber-400" },
                  { code: "119", desc: "Transaction is awaiting Reversal", color: "text-amber-400" },
                  { code: "120", desc: "Delivery status cannot be updated", color: "text-amber-400" },
                  { code: "121", desc: "Transaction confirmed by Merchant", color: "text-green-400" },
                  { code: "122", desc: "Reversed", color: "text-amber-400" },
                  { code: "124", desc: "Order placed, waiting for financials (OTC)", color: "text-green-400" },
                  { code: "125", desc: "Order delivered", color: "text-green-400" },
                  { code: "126", desc: "Transaction is disputed", color: "text-amber-400" },
                  { code: "127", desc: "Transaction not allowed due to maintenance", color: "text-amber-400" },
                  { code: "128", desc: "Awaiting action by scheme on Dispute", color: "text-amber-400" },
                  { code: "129", desc: "Transaction is dropped", color: "text-amber-400" },
                  { code: "131", desc: "Transaction is Refunded", color: "text-green-400" },
                  { code: "132", desc: "Cannot be refunded", color: "text-red-400" },
                  { code: "134", desc: "Transaction has been timed out", color: "text-amber-400" },
                  { code: "135", desc: "Invalid BIN was entered for discount", color: "text-red-400" },
                  { code: "157", desc: "Transaction is pending (MWALLET and MIGS)", color: "text-amber-400" },
                  { code: "199", desc: "System error", color: "text-red-400" },
                  { code: "200", desc: "Transaction approved – Post authorization", color: "text-green-400" },
                  { code: "210", desc: "Authorization pending", color: "text-amber-400" },
                  { code: "401", desc: "Transaction could not be processed, try again", color: "text-amber-400" },
                  { code: "402", desc: "Transaction declined by bank", color: "text-red-400" },
                  { code: "403", desc: "Transaction timed out", color: "text-amber-400" },
                  { code: "404", desc: "Card is expired", color: "text-red-400" },
                  { code: "405", desc: "Insufficient balance in card", color: "text-amber-400" },
                  { code: "406", desc: "System error, try again", color: "text-red-400" },
                  { code: "407", desc: "Internal system error", color: "text-red-400" },
                  { code: "408", desc: "Bank does not support internet transactions", color: "text-red-400" },
                  { code: "409", desc: "Transaction declined - do not contact issuer", color: "text-red-400" },
                  { code: "410", desc: "Transaction aborted", color: "text-amber-400" },
                  { code: "411", desc: "Transaction blocked due to risk", color: "text-red-400" },
                  { code: "414", desc: "Transaction declined, contact bank", color: "text-red-400" },
                  { code: "415", desc: "3D Secure ID verification failed", color: "text-red-400" },
                  { code: "416", desc: "CVV verification failed", color: "text-red-400" },
                  { code: "417", desc: "Order locked - another transaction in progress", color: "text-amber-400" },
                  { code: "419", desc: "Card not enrolled in 3D secure", color: "text-amber-400" },
                  { code: "421", desc: "Retry limit exhausted", color: "text-red-400" },
                  { code: "422", desc: "Transaction declined due to duplication", color: "text-red-400" },
                  { code: "423", desc: "Address verification failed", color: "text-red-400" },
                  { code: "424", desc: "Wrong CVV", color: "text-red-400" },
                  { code: "425", desc: "Address verification and card security code failed", color: "text-red-400" },
                  { code: "426", desc: "Transaction declined due to payment plan", color: "text-red-400" },
                  { code: "429", desc: "Transaction not processed, try again", color: "text-amber-400" },
                  { code: "430", desc: "Request rejected", color: "text-red-400" },
                  { code: "431", desc: "Server failed", color: "text-red-400" },
                  { code: "432", desc: "Server busy", color: "text-amber-400" },
                  { code: "435", desc: "Card enrolled", color: "text-green-400" },
                  { code: "444", desc: "ACS session timeout", color: "text-amber-400" },
                  { code: "446", desc: "Authentication failed", color: "text-red-400" },
                  { code: "448", desc: "Card does not support 3DS", color: "text-amber-400" },
                  { code: "999", desc: "Transaction failed (technical issue at PG or Bank)", color: "text-red-400" },
                ].map((r) => (
                  <tr key={r.code} className="border-t border-white/5 hover:bg-white/5">
                    <td className={`p-1.5 font-mono font-bold ${r.color}`}>{r.code}</td>
                    <td className="p-1.5">{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
