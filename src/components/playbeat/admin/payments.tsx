"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Smartphone,
  Bitcoin,
  Building2,
  CheckCircle2,
  XCircle,
  Settings,
  Plus,
  Shield,
  Zap,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof CreditCard> = {
  CreditCard,
  Smartphone,
  Bitcoin,
  Building2,
};

const GATEWAY_CONFIG_FIELDS: Record<
  string,
  Array<{ key: string; label: string; placeholder: string; type?: string }>
> = {
  lemonsqueezy: [
    { key: "LEMONSQUEEZY_API_KEY", label: "API Key", placeholder: "eyJ0eXA..." },
    { key: "LEMONSQUEEZY_STORE_ID", label: "Store ID", placeholder: "420060" },
  ],
  stripe: [
    { key: "STRIPE_SECRET_KEY", label: "Secret Key", placeholder: "sk_live_..." },
    { key: "STRIPE_PUBLISHABLE_KEY", label: "Publishable Key", placeholder: "pk_live_..." },
  ],
  paypal: [
    { key: "PAYPAL_CLIENT_ID", label: "Client ID", placeholder: "AY..." },
    { key: "PAYPAL_CLIENT_SECRET", label: "Client Secret", placeholder: "EL..." },
  ],
  paddle: [
    { key: "PADDLE_API_KEY", label: "API Key", placeholder: "..." },
    { key: "PADDLE_VENDOR_ID", label: "Vendor ID", placeholder: "12345" },
  ],
  jazzcash: [
    { key: "JAZZCASH_MERCHANT_ID", label: "Merchant ID", placeholder: "MCxxxxx" },
    { key: "JAZZCASH_PASSWORD", label: "Password", placeholder: "xxxxxx", type: "password" },
    { key: "JAZZCASH_INTEGRITY_SALT", label: "Integrity Salt", placeholder: "xxxx...xxxx", type: "password" },
    { key: "JAZZCASH_SANDBOX", label: "Sandbox Mode (true/false)", placeholder: "true" },
    { key: "JAZZCASH_RETURN_URL", label: "Return URL", placeholder: "https://playbeat.live/api/v1/payments/jazzcash/return" },
    { key: "JAZZCASH_POSTBACK_URL", label: "Postback URL (IPN)", placeholder: "https://playbeat.live/api/v1/payments/jazzcash/webhook" },
  ],
  easypaisa: [
    { key: "EASYPAISA_MERCHANT_ID", label: "Merchant ID", placeholder: "xxxxx" },
    { key: "EASYPAISA_PASSWORD", label: "Password", placeholder: "xxxxxx", type: "password" },
    { key: "EASYPAISA_STORE_ID", label: "Store ID", placeholder: "xxxxx" },
  ],
  crypto: [
    { key: "COINBASE_API_KEY", label: "Coinbase API Key", placeholder: "..." },
    { key: "COINBASE_WEBHOOK_SECRET", label: "Webhook Secret", placeholder: "..." },
  ],
  banktransfer: [
    { key: "BANK_ALFALAH_ACCOUNT_NUMBER", label: "Account Number", placeholder: "0000000000000000" },
    { key: "BANK_ALFALAH_ACCOUNT_TITLE", label: "Account Title", placeholder: "PlayBeat Digital Pvt Ltd" },
    { key: "BANK_ALFALAH_IBAN", label: "IBAN", placeholder: "PK36ALFH0000000000000000" },
  ],
};

export function AdminPayments() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payment-gateways"],
    queryFn: () => api.paymentGateways(),
    staleTime: 15_000,
  });

  const [configGateway, setConfigGateway] = React.useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = React.useState({
    threeDSecure: true,
    autoCapture: true,
    failedRetry: true,
    testMode: false,
  });

  const gateways = data?.gateways || [];
  const summary = data?.summary;

  const handleConfigure = (id: string) => {
    setConfigGateway(id);
  };

  const handleActivateToggle = (id: string, currentlyActive: boolean) => {
    if (!currentlyActive) {
      toast.message(`Configure ${id} in .env to activate it`);
      setConfigGateway(id);
    } else {
      toast.message(`${id} is active — remove env vars to deactivate`);
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
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
          <CreditCard className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Payment Gateways</h1>
          <p className="text-sm text-muted-foreground">
            Configure and manage your payment providers
          </p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 bg-white/5"
          onClick={() => {
            refetch();
            toast.success("Gateway status refreshed");
          }}
        >
          <RefreshCw className="size-4" /> Refresh
        </Button>
        <Button onClick={() => toast.message("Add Gateway — configure any of the available gateways below")}>
          <Plus className="size-4" /> Add Gateway
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Active Gateways",
            value: summary?.active || 0,
            icon: CheckCircle2,
            color: "text-green-400",
          },
          {
            label: "Total Gateways",
            value: summary?.total || 8,
            icon: CreditCard,
            color: "text-blue-400",
          },
          {
            label: "Live Mode",
            value: summary?.live || 0,
            icon: Zap,
            color: "text-amber-400",
          },
          {
            label: "Sandbox",
            value: summary?.sandbox || 0,
            icon: Shield,
            color: "text-purple-400",
          },
        ].map((s) => (
          <Card key={s.label} className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <s.icon className="size-3.5" /> {s.label}
              </div>
              <p className={cn("mt-1 text-2xl font-bold", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gateway cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))
          : gateways.map((g, i) => {
              const Icon = ICONS[g.icon] || CreditCard;
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    className={cn(
                      "border-white/10 bg-white/5 backdrop-blur-xl transition-all",
                      g.active
                        ? "border-green-500/30"
                        : "opacity-80 hover:opacity-100",
                    )}
                  >
                    <CardContent className="p-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "grid size-11 place-items-center rounded-xl bg-gradient-to-br shadow-lg",
                              g.color,
                            )}
                          >
                            <Icon className="size-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold">{g.name}</h3>
                              {g.active ? (
                                <Badge className="bg-green-500/15 text-green-400">
                                  <span className="mr-1 size-1.5 rounded-full bg-green-400" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/15 text-red-400">
                                  <XCircle className="mr-1 size-2.5" />
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {g.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={g.active}
                          onCheckedChange={() =>
                            handleActivateToggle(g.id, g.active)
                          }
                        />
                      </div>

                      {/* Details */}
                      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Fees</p>
                          <p className="font-medium">{g.fees}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Settlement</p>
                          <p className="font-medium">{g.settlement}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mode</p>
                          <Badge
                            className={
                              g.mode === "LIVE"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-purple-500/15 text-purple-400"
                            }
                          >
                            {g.mode}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-white/10 bg-white/5"
                          onClick={() => handleConfigure(g.id)}
                        >
                          <Settings className="size-3.5" /> Configure
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toast.message(`Transactions for ${g.name} — coming soon`)}
                        >
                          <TrendingUp className="size-3.5" /> Transactions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      {/* Gateway Settings */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4" /> Gateway Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Global payment configuration
          </p>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            {
              key: "threeDSecure" as const,
              title: "3D Secure",
              desc: "Require SCA for EU card payments",
            },
            {
              key: "autoCapture" as const,
              title: "Auto-capture",
              desc: "Capture funds immediately on authorization",
            },
            {
              key: "failedRetry" as const,
              title: "Failed payment retry",
              desc: "Retry failed payments up to 3 times",
            },
            {
              key: "testMode" as const,
              title: "Test mode",
              desc: "Force all gateways into sandbox mode",
            },
          ].map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-white/5"
            >
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <Switch
                checked={globalSettings[s.key]}
                onCheckedChange={(v) => {
                  setGlobalSettings((prev) => ({ ...prev, [s.key]: v }));
                  toast.success(`${s.title} ${v ? "enabled" : "disabled"}`);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Configuration dialog */}
      <Dialog
        open={!!configGateway}
        onOpenChange={(open) => !open && setConfigGateway(null)}
      >
        <DialogContent className="border-white/10 bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-4" />
              Configure{" "}
              {gateways.find((g) => g.id === configGateway)?.name || "Gateway"}
            </DialogTitle>
            <DialogDescription>
              Add these environment variables to your{" "}
              <code className="rounded bg-muted px-1 text-xs">.env</code> file,
              then restart the server to activate this gateway.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {configGateway &&
              GATEWAY_CONFIG_FIELDS[configGateway]?.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs font-medium">{field.label}</Label>
                  <Input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    className="border-white/10 bg-white/5 font-mono text-xs"
                    readOnly
                    value={field.placeholder}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    <code className="text-blue-400">{field.key}</code>
                  </p>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfigGateway(null)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                const gateway = gateways.find((g) => g.id === configGateway);
                const fields = configGateway
                  ? GATEWAY_CONFIG_FIELDS[configGateway]
                  : [];
                const envLines = fields
                  .map((f) => `${f.key}=${f.placeholder}`)
                  .join("\n");
                navigator.clipboard?.writeText(envLines);
                toast.success(`${gateway?.name} config copied to clipboard — paste into .env`);
                setConfigGateway(null);
              }}
            >
              Copy .env config
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
