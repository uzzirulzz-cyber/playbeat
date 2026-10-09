import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";

export const dynamic = "force-dynamic";

const toNumber = (row: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

// GET /api/admin/adsterra-stats — authenticated Adsterra publisher reporting.
export async function GET() {
  const user = await requireOrg();
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const apiKey = process.env.ADSTERRA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, connected: false, error: "Adsterra API key is not configured." });
  }

  const finish = new Date();
  const start = new Date(finish.getTime() - 6 * 24 * 60 * 60 * 1000);
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);
  const url = new URL("https://api3.adsterratools.com/publisher/stats.json");
  url.searchParams.set("start_date", formatDate(start));
  url.searchParams.set("finish_date", formatDate(finish));
  url.searchParams.set("group_by", "placement");

  try {
    const response = await fetch(url, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ configured: true, connected: false, error: "Adsterra reporting is temporarily unavailable." });
    }

    const payload: unknown = await response.json();
    const rows: Record<string, unknown>[] = Array.isArray(payload)
      ? payload as Record<string, unknown>[]
      : payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: Record<string, unknown>[] }).data
        : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)
          ? (payload as { items: Record<string, unknown>[] }).items
          : [];

    const placements = rows.map((row) => {
      const impressions = toNumber(row, "impressions", "views");
      const clicks = toNumber(row, "clicks");
      return {
        name: String(row.placement ?? row.placement_name ?? row.name ?? "Placement").slice(0, 120),
        impressions,
        clicks,
        ctr: toNumber(row, "ctr") || (impressions ? clicks / impressions * 100 : 0),
        cpm: toNumber(row, "cpm"),
        revenue: toNumber(row, "revenue"),
      };
    });
    const totals = placements.reduce((sum, row) => ({
      impressions: sum.impressions + row.impressions,
      clicks: sum.clicks + row.clicks,
      revenue: sum.revenue + row.revenue,
    }), { impressions: 0, clicks: 0, revenue: 0 });

    return NextResponse.json({
      configured: true,
      connected: true,
      period: { start: formatDate(start), finish: formatDate(finish) },
      totals: { ...totals, ctr: totals.impressions ? totals.clicks / totals.impressions * 100 : 0 },
      placements,
    });
  } catch {
    return NextResponse.json({ configured: true, connected: false, error: "Could not reach Adsterra reporting." });
  }
}
