"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart as WooCommerceIcon,
  ShoppingCart,
  Search,
  Package,
  TrendingUp,
  DollarSign,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400",
  processing: "bg-blue-500/15 text-blue-400",
  pending: "bg-amber-500/15 text-amber-400",
  cancelled: "bg-red-500/15 text-red-400",
  refunded: "bg-purple-500/15 text-purple-400",
  failed: "bg-red-500/15 text-red-400",
  publish: "bg-green-500/15 text-green-400",
  draft: "bg-gray-500/15 text-gray-400",
  instock: "bg-green-500/15 text-green-400",
  outofstock: "bg-red-500/15 text-red-400",
  onbackorder: "bg-amber-500/15 text-amber-400",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function AdminWooCommerce() {
  const [tab, setTab] = React.useState<"products" | "orders">("products");
  const [search, setSearch] = React.useState("");

  const productsQ = useQuery({
    queryKey: ["wc-products"],
    queryFn: () => api.woocommerceProducts(),
    staleTime: 60_000,
  });
  const ordersQ = useQuery({
    queryKey: ["wc-orders"],
    queryFn: () => api.woocommerceOrders(),
    staleTime: 60_000,
  });

  const configured = productsQ.data?.configured ?? false;
  const error = productsQ.data?.error || ordersQ.data?.error;
  const products = (productsQ.data?.items || []).filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const orders = (ordersQ.data?.items || []).filter(
    (o) =>
      !search ||
      o.number.includes(search) ||
      `${o.billing.first_name} ${o.billing.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + parseFloat(o.total || "0"), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
          <WooCommerceIcon className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">WooCommerce</h1>
          <p className="text-sm text-muted-foreground">
            Sync products, orders, and customers from your WooCommerce store
          </p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5"
          onClick={() => {
            productsQ.refetch();
            ordersQ.refetch();
            toast.success("Syncing WooCommerce data...");
          }}
        >
          <RefreshCw className="size-4" /> Sync
        </Button>
      </div>

      {/* Not configured state — Setup Wizard */}
      {!configured && !productsQ.isLoading && (
        <WooCommerceSetupWizard />
      )}

      {/* Always show setup wizard link for re-configuration */}
      {configured && (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Settings className="size-3.5" />
              Connected to: <code className="text-blue-400">{productsQ.data?.configured ? "configured store" : "—"}</code>
            </div>
            <a
              href="https://woocommerce.com/woocommerce/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
            >
              <ExternalLink className="size-3" />
             woocommerce.com
            </a>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {configured && error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="size-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {configured && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="size-3.5" /> Products
              </div>
              <p className="mt-1 text-2xl font-bold text-blue-400">
                {productsQ.data?.items.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShoppingCart className="size-3.5" /> Orders
              </div>
              <p className="mt-1 text-2xl font-bold text-purple-400">
                {ordersQ.data?.items.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="size-3.5" /> Revenue
              </div>
              <p className="mt-1 text-2xl font-bold text-green-400">
                {totalRevenue > 0 ? `$${totalRevenue.toFixed(2)}` : "—"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="size-3.5" /> Completed
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-400">
                {orders.filter((o) => o.status === "completed").length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {configured && (
        <div className="flex gap-2">
          {(["products", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {configured && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="border-white/10 bg-white/5 pl-9"
          />
        </div>
      )}

      {/* Products table */}
      {configured && tab === "products" && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Product</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 text-right">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {productsQ.isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="p-4">
                            <Skeleton className="h-6 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.images?.[0]?.src ? (
                              <img
                                src={p.images[0].src}
                                alt={p.name}
                                className="size-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="grid size-10 place-items-center rounded-lg bg-white/5">
                                <Package className="size-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="line-clamp-1 font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.categories?.[0]?.name || "Uncategorized"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {p.sale_price ? (
                            <div>
                              <span className="font-bold text-green-400">
                                ${p.sale_price}
                              </span>
                              <span className="ml-1 text-xs text-muted-foreground line-through">
                                ${p.regular_price}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold">
                              {p.price ? `$${p.price}` : "—"}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge className={STATUS_COLORS[p.status] || "bg-gray-500/15"}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={STATUS_COLORS[p.stock_status] || "bg-gray-500/15"}>
                            {p.stock_status?.replace(/([A-Z])/g, " $1").trim() || "—"}
                          </Badge>
                        </td>
                        <td className="p-4 capitalize text-muted-foreground">
                          {p.type}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => window.open(p.permalink, "_blank")}
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders table */}
      {configured && tab === "orders" && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Order #</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersQ.isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="p-4">
                            <Skeleton className="h-6 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/5"
                      >
                        <td className="p-4 font-mono text-xs font-medium">
                          #{o.number}
                        </td>
                        <td className="p-4">
                          <p className="font-medium">
                            {o.billing.first_name} {o.billing.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {o.billing.email}
                          </p>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {o.line_items?.length || 0} item(s)
                        </td>
                        <td className="p-4 font-bold">
                          {o.total} {o.currency}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {o.payment_method_title || "—"}
                        </td>
                        <td className="p-4">
                          <Badge className={STATUS_COLORS[o.status] || "bg-gray-500/15"}>
                            {o.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(o.date_created).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Setup Wizard Component ──────────────────────────────────────────────
function WooCommerceSetupWizard() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [storeUrl, setStoreUrl] = React.useState("");
  const [consumerKey, setConsumerKey] = React.useState("");
  const [consumerSecret, setConsumerSecret] = React.useState("");
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<any>(null);

  const handleTest = async () => {
    if (!storeUrl || !consumerKey || !consumerSecret) {
      toast.error("Fill in all three fields first");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.woocommerceTest({
        storeUrl,
        consumerKey,
        consumerSecret,
      });
      setTestResult(result);
      toast.success(`✓ Connected! Found ${result.productCount} products.`);
      setStep(3);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      setTestResult({ error: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const envSnippet = `WOOCOMMERCE_STORE_URL=${storeUrl || "https://your-store.com"}
WOOCOMMERCE_CONSUMER_KEY=${consumerKey || "ck_xxxxx"}
WOOCOMMERCE_CONSUMER_SECRET=${consumerSecret ? "cs_xxxxx" : "cs_xxxxx"}`;

  return (
    <div className="space-y-4">
      {/* Hero card with link to woocommerce.com */}
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="grid size-14 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
            <ShoppingCart className="size-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">Connect Your WooCommerce Store</p>
            <p className="text-sm text-muted-foreground">
              Sync products, orders, and customers from your WooCommerce store in real-time.
              Don&apos;t have one yet?
            </p>
          </div>
          <a
            href="https://woocommerce.com/woocommerce/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300 ring-1 ring-purple-500/30 transition-colors hover:bg-purple-500/30"
          >
            <ExternalLink className="size-4" />
            Get WooCommerce
          </a>
        </CardContent>
      </Card>

      {/* Step indicator */}
      <div className="flex items-center justify-between gap-2">
        {[
          { n: 1, label: "Get API Keys" },
          { n: 2, label: "Test Connection" },
          { n: 3, label: "Save & Sync" },
        ].map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center">
            <div
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                step >= s.n
                  ? "bg-purple-500 text-white"
                  : "bg-white/5 text-slate-400",
              )}
            >
              {step > s.n ? "✓" : s.n}
            </div>
            <span
              className={cn(
                "ml-2 text-xs font-medium",
                step >= s.n ? "text-purple-300" : "text-slate-400",
              )}
            >
              {s.label}
            </span>
            {i < 2 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1",
                  step > s.n ? "bg-purple-500" : "bg-white/10",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Get API Keys */}
      {step === 1 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-base">Step 1 — Generate WooCommerce API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Log in to your WordPress admin and follow these steps:
            </p>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">1</span>
                <div>
                  Log in to your WordPress admin at <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-blue-400">https://your-store.com/wp-admin</code>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">2</span>
                <div>
                  Go to <strong>WooCommerce → Settings → Advanced → REST API</strong>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">3</span>
                <div>
                  Click <strong>&quot;Add key&quot;</strong> and fill in:
                  <ul className="mt-1 ml-4 list-disc text-xs text-muted-foreground">
                    <li><strong>Description:</strong> PlayBeat Digital Sync</li>
                    <li><strong>User:</strong> Admin (or your account)</li>
                    <li><strong>Permissions:</strong> <span className="text-amber-400 font-semibold">Read/Write</span></li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">4</span>
                <div>
                  Click <strong>&quot;Generate API key&quot;</strong>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">5</span>
                <div>
                  Copy the <strong>Consumer key</strong> (starts with <code className="text-blue-400">ck_</code>) and <strong>Consumer secret</strong> (starts with <code className="text-blue-400">cs_</code>)
                  <p className="mt-1 text-xs text-amber-400">⚠️ Save the secret now — WooCommerce won&apos;t show it again after you leave the page.</p>
                </div>
              </li>
            </ol>
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400">Don&apos;t have a WooCommerce store yet?</p>
              <p className="mt-1">
                WooCommerce is the most popular open-source eCommerce platform for WordPress.
                It powers millions of online stores worldwide.
              </p>
              <a
                href="https://woocommerce.com/woocommerce/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-blue-400 underline hover:text-blue-300"
              >
                <ExternalLink className="size-3" />
                Visit woocommerce.com to get started →
              </a>
            </div>
            <Button onClick={() => setStep(2)} className="w-full">
              I have my API keys → Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Test Connection */}
      {step === 2 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-base">Step 2 — Test Connection</CardTitle>
            <p className="text-sm text-muted-foreground">
              Paste your credentials below. We&apos;ll test the connection WITHOUT saving —
              you&apos;ll see your products appear instantly if it works.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Store URL</label>
              <Input
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="https://your-store.com"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Consumer Key</label>
              <Input
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                placeholder="ck_xxxxxxxxxxxxxxxxxxxx"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Consumer Secret</label>
              <Input
                type="password"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                placeholder="cs_xxxxxxxxxxxxxxxxxxxx"
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                ← Back
              </Button>
              <Button
                onClick={handleTest}
                disabled={testing || !storeUrl || !consumerKey || !consumerSecret}
                className="flex-1 gap-2"
              >
                {testing ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Testing…
                  </>
                ) : (
                  <>Test Connection</>
                )}
              </Button>
            </div>

            {/* Test result */}
            {testResult?.error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm">
                <p className="flex items-center gap-2 font-semibold text-red-400">
                  <AlertCircle className="size-4" /> Connection failed
                </p>
                <p className="mt-1 text-xs text-red-300">{testResult.error}</p>
              </div>
            )}

            {testResult?.success && (
              <div className="space-y-3">
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                  <p className="flex items-center gap-2 font-bold text-green-400">
                    ✓ Connected successfully!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {testResult.message}
                  </p>
                  {testResult.storeInfo && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">WC Version:</span>{" "}
                        <span className="font-medium">{testResult.storeInfo.version || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">WP Version:</span>{" "}
                        <span className="font-medium">{testResult.storeInfo.wordpressVersion || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Currency:</span>{" "}
                        <span className="font-medium">{testResult.storeInfo.currency || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Country:</span>{" "}
                        <span className="font-medium">{testResult.storeInfo.country || "—"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sample products */}
                {testResult.sampleProducts?.length > 0 && (
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold text-slate-300">
                      Sample products from your store:
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {testResult.sampleProducts.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between rounded bg-white/5 px-2 py-1.5 text-xs">
                          <span className="font-medium">{p.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400">${p.price || "0"}</span>
                            <Badge
                              className={cn(
                                "text-[9px]",
                                p.status === "publish"
                                  ? "bg-green-500/15 text-green-400"
                                  : "bg-gray-500/15 text-gray-400",
                              )}
                            >
                              {p.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Save & Sync */}
      {step === 3 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4 text-green-400" /> Step 3 — Save to .env & Activate
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your connection works! Add these lines to your <code>.env</code> file
              and restart the dev server to start syncing.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-black/40 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Add to .env:
              </p>
              <pre className="overflow-x-auto text-[11px] text-green-400">
{envSnippet}
              </pre>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400">After saving .env:</p>
              <ol className="mt-1 ml-4 list-decimal space-y-0.5">
                <li>Restart the dev server (Ctrl+C, then <code>bun run dev</code>)</li>
                <li>Come back to this page and click <strong>Sync</strong> at the top</li>
                <li>Your WooCommerce products and orders will appear in the tabs below</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                ← Back to Test
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard?.writeText(envSnippet);
                  toast.success(".env snippet copied to clipboard");
                }}
                className="flex-1 gap-2"
              >
                <ShoppingCart className="size-4" />
                Copy .env Snippet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
