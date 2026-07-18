import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /wp-json
 *
 * Returns a WordPress-compatible REST API discovery response.
 * This makes playbeat.digital appear as a WordPress site to WooCommerce clients.
 */
export async function GET() {
  return NextResponse.json({
    name: "PlayBeat Digital",
    description: "PlayBeat Digital — Premium Digital Products Marketplace",
    url: "https://playbeat.digital",
    home: "https://playbeat.digital",
    site_icon: "https://playbeat.digital/favicon.png",
    namespaces: [
      "wp/v2",
      "wc/v3",
      "wc/store/v1",
      "wc/store",
    ],
    routes: {
      "/wp/v2/posts": { methods: ["GET"] },
      "/wp/v2/pages": { methods: ["GET"] },
      "/wc/v3/products": { methods: ["GET", "POST"] },
      "/wc/v3/orders": { methods: ["GET", "POST"] },
      "/wc/v3/customers": { methods: ["GET", "POST"] },
      "/wc/v3/system_status": { methods: ["GET"] },
      "/wc/store/v1/products": { methods: ["GET"] },
    },
    authentication: {
      wc_v3: {
        type: "basic",
        description: "WooCommerce REST API — use Consumer Key + Secret as Basic Auth",
      },
    },
    _links: {
      self: [{ href: "https://playbeat.digital/wp-json" }],
      help: [{ href: "https://developer.woocommerce.com/docs/" }],
    },
  });
}
