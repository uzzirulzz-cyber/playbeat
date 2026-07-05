"use client";

import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { Marketplace } from "@/components/playbeat/marketplace";
import { ProductDetailSheet } from "@/components/playbeat/product-detail-sheet";
import { CartSheet } from "@/components/playbeat/cart-sheet";

/**
 * /marketplace
 *
 * The product marketplace — browse, search, filter, and buy digital
 * products. This is SEPARATE from the marketing landing page at `/`.
 *
 * Supports query params for category filtering:
 *   /marketplace                — all products
 *   /marketplace?category=games — games only
 *   /marketplace?category=ai-tools — AI tools only
 *   /marketplace?sort=price_asc — sorted by price
 */
export default function MarketplacePage() {
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
