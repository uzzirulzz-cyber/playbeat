"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { Marketplace } from "@/components/playbeat/marketplace";
import { ProductDetailSheet } from "@/components/playbeat/product-detail-sheet";
import { CartSheet } from "@/components/playbeat/cart-sheet";
import { usePlaybeatStore } from "@/lib/store";

/**
 * Home page — the storefront.
 *
 * This is a SINGLE page that combines:
 *   1. Marketing hero (eyebrow, headline, subheadline, CTAs, stats)
 *   2. Premium collection brand strip
 *   3. Browse by category pills
 *   4. Filter bar (search, type, sort, price range, featured toggle)
 *   5. Product grid (with pagination)
 *
 * All of the above is rendered by the <Marketplace /> component, which
 * has its own Hero + BrandStrip + product grid. We wrap it with the
 * site Header (nav + cart + search) and Footer.
 *
 * URL query params (?category=games, ?sort=price_asc, ?search=foo) are
 * synced to the Zustand store so the Marketplace component can react
 * to them.
 */
function StorefrontWithSearchParams() {
  const searchParams = useSearchParams();
  const setNavFilter = usePlaybeatStore((s) => s.setNavFilter);
  const setSearchQuery = usePlaybeatStore((s) => s.setSearchQuery);

  // Sync URL query params → Zustand store on mount + when params change
  React.useEffect(() => {
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "popular";
    const search = searchParams.get("search") || "";

    setNavFilter(category, sort);
    if (search) setSearchQuery(search);
  }, [searchParams, setNavFilter, setSearchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Marketplace />
      </main>
      <Footer />
      {/* Global overlays */}
      <ProductDetailSheet />
      <CartSheet />
    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <StorefrontWithSearchParams />
    </React.Suspense>
  );
}
