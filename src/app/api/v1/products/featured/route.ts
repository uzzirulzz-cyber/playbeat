import { NextRequest } from "next/server";
import { ok, applyRateLimit } from "@/lib/api";
import { getLemonSqueezyProducts } from "@/lib/lemon-squeezy";
import { ensureSeeded } from "@/lib/ensure-seed";
import { db } from "@/lib/db";

/**
 * GET /api/v1/products/featured
 *
 * Returns up to 8 featured products for the storefront hero section.
 * Priority: Lemon Squeezy featured products → DB featured products →
 * DB products sorted by salesCount (most popular).
 */
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 60);
  if (limited) return limited;
  await ensureSeeded();

  // Try Lemon Squeezy first
  const { configured: lsConfigured, items: lsItems } = await getLemonSqueezyProducts();

  if (lsConfigured && lsItems.length > 0) {
    return ok({ items: lsItems.slice(0, 8), configured: true });
  }

  // Fall back to DB products (seeded)
  try {
    // First try featured products
    let dbProducts = await db.product.findMany({
      where: { status: "PUBLISHED", featured: true },
      include: { category: true, vendor: true },
      take: 8,
      orderBy: { salesCount: "desc" },
    });

    // If no featured products, fall back to most popular
    if (dbProducts.length === 0) {
      dbProducts = await db.product.findMany({
        where: { status: "PUBLISHED" },
        include: { category: true, vendor: true },
        take: 8,
        orderBy: { salesCount: "desc" },
      });
    }

    const items = dbProducts.map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription || "",
      description: p.description || "",
      type: p.type,
      status: p.status,
      price: p.discountPrice ?? p.price,
      regularPrice: p.price,
      discountPrice: p.discountPrice,
      currency: p.currency || "PKR",
      cover: p.cover || "",
      featured: p.featured || false,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      salesCount: p.salesCount || 0,
      vendor: p.vendor
        ? {
            id: p.vendor.id,
            storeName: p.vendor.storeName,
            slug: p.vendor.slug,
            verified: p.vendor.verified,
          }
        : null,
      category: p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : null,
      createdAt: p.createdAt,
      effectivePrice: p.discountPrice ?? p.price,
      source: "db" as const,
    }));

    return ok({ items, configured: items.length > 0 });
  } catch (e) {
    // DB cold start — return empty
    return ok({ items: [], configured: false });
  }
}
