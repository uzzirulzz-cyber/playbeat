"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Search, Sparkles, DollarSign, TrendingUp } from "lucide-react";
import { api, formatPrice } from "@/lib/api-client";
import { toast } from "sonner";

export function AiToolsModule() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");

  // Fetch real AI tool products from the database
  const { data, isLoading } = useQuery({
    queryKey: ["ai-tools-products", search],
    queryFn: () => api.products({ search, category: "ai-tools", limit: 48 }),
    staleTime: 30_000,
  });

  const products = (data?.items || []).filter((p: any) =>
    p.type === "AI_TOOL" || p.category?.slug === "ai-tools"
  );

  const totalRevenue = products.reduce((s: number, p: any) => s + (p.salesCount || 0) * (p.effectivePrice || p.price), 0);
  const totalSales = products.reduce((s: number, p: any) => s + (p.salesCount || 0), 0);

  const stats = [
    { label: "AI Tools", value: String(products.length), icon: <Bot size={18} className="text-purple-500" />, bg: "bg-purple-50 dark:bg-purple-950" },
    { label: "Total Sales", value: String(totalSales), icon: <TrendingUp size={18} className="text-green-500" />, bg: "bg-green-50 dark:bg-green-950" },
    { label: "Revenue", value: formatPrice(totalRevenue), icon: <DollarSign size={18} className="text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-950" },
    { label: "Featured", value: String(products.filter((p: any) => p.featured).length), icon: <Sparkles size={18} className="text-amber-500" />, bg: "bg-amber-50 dark:bg-amber-950" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your AI tool products — ChatGPT, Midjourney, Claude, and more.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search AI tools..."
          className="pl-9"
        />
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bot className="mx-auto mb-3 size-12 text-muted-foreground" />
            <p className="font-medium">No AI tools found</p>
            <p className="text-sm text-muted-foreground">
              Add AI tool products from the Products section
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("admin-navigate", { detail: "products" }));
              }}
            >
              Go to Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p: any) => (
            <Card key={p.id} className="overflow-hidden">
              {/* Cover image */}
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                {p.cover && (p.cover.startsWith("http") || p.cover.startsWith("data:")) ? (
                  <img src={p.cover} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bot className="size-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold line-clamp-1">{p.title}</h3>
                  {p.featured && (
                    <Badge className="bg-amber-400/20 text-amber-600 text-[9px] shrink-0">
                      ★ Featured
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {p.shortDescription || p.description || "AI tool product"}
                </p>
                {/* Variants */}
                {(() => {
                  let variants: string[] = [];
                  try {
                    const raw = (p as any).variants;
                    if (raw) variants = typeof raw === "string" ? JSON.parse(raw) : raw;
                  } catch {}
                  if (variants.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-1">
                      {variants.slice(0, 4).map((v) => (
                        <Badge key={v} variant="outline" className="text-[9px]">
                          {v}
                        </Badge>
                      ))}
                      {variants.length > 4 && (
                        <Badge variant="outline" className="text-[9px]">
                          +{variants.length - 4} more
                        </Badge>
                      )}
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {formatPrice(p.effectivePrice || p.price)}
                    </span>
                    {p.discountPrice && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        Rs {p.regularPrice || p.price}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[9px]">
                    {p.salesCount || 0} sold
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Refresh */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ["ai-tools-products"] });
            toast.success("Refreshed AI tools");
          }}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
