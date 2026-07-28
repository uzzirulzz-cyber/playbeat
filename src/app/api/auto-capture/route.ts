import { NextResponse } from "next/server";
import { db, withRetry } from "@/lib/db";
import { requireOrg, writeAuditLog } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auto-capture — instant device capture when a mobile device
// opens the web app. Detects device info from user-agent + client hints,
// captures GPS (provided by the browser), and creates a Device record
// with monitoring + E2E encryption enabled.
export async function POST(req: Request) {
  const user = await requireOrg();
  if (!user.organizationId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    userAgent?: string;
    gpsLat?: number;
    gpsLon?: number;
    gpsAccuracy?: number;
    batteryPercent?: number;
    screenResolution?: string;
    language?: string;
    timezone?: string;
    platform?: string;
  };

  // Parse user-agent to extract device make/model/OS
  const ua = body.userAgent || req.headers.get("user-agent") || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = /Mobile|iPhone|Android|iPad|iPod/i.test(ua);

  if (!isMobile) {
    return NextResponse.json({
      captured: false,
      reason: "not_mobile",
      message: "Auto-capture is only available on mobile devices.",
    });
  }

  // Extract device info from user-agent
  let make = "Unknown";
  let model = "Unknown Device";
  let os = "other";
  let osVersion: string | undefined;

  if (isIOS) {
    make = "Apple";
    os = "ios";
    const modelMatch = ua.match(/iPhone([0-9_,]+)/);
    if (modelMatch) {
      model = "iPhone";
    } else {
      model = "iPhone";
    }
    const versionMatch = ua.match(/OS (\d+[_.]\d+[_.]?\d*)/);
    if (versionMatch) {
      osVersion = versionMatch[1].replace(/_/g, ".");
    }
  } else if (isAndroid) {
    make = "Android";
    os = "android";
    const modelMatch = ua.match(/Android[^;]*;\s*([^)]+)\s*Build/);
    if (modelMatch) {
      model = modelMatch[1].trim();
      // Try to extract make from model
      const makeMatch = model.match(/^([A-Za-z]+)/);
      if (makeMatch) make = makeMatch[1];
    }
    const versionMatch = ua.match(/Android (\d+[.\d]*)/);
    if (versionMatch) {
      osVersion = versionMatch[1];
    }
  }

  // Generate evidence bag ID
  const evidenceBagId = `EV-AUTO-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  // Find or create a default "Auto-Captured Devices" case for the org
  let autoCase = await withRetry(() =>
    db.case.findFirst({
      where: {
        organizationId: user.organizationId!,
        title: "Auto-Captured Devices",
      },
    })
  );

  if (!autoCase) {
    autoCase = await withRetry(() =>
      db.case.create({
        data: {
          organizationId: user.organizationId!,
          caseNumber: `FNQ-AUTO-${Date.now().toString(36).toUpperCase()}`,
          title: "Auto-Captured Devices",
          description: "Automatically created case for devices captured when visiting the web app on mobile.",
          status: "active",
          priority: "high",
          createdById: user.id,
          tags: JSON.stringify(["auto-captured", "mobile"]),
        },
      })
    );
  }

  // Check if this device was already captured (by IMEI or serial — but we
  // don't have those from a browser. Use a fingerprint from UA + screen)
  const fingerprint = `${make}-${model}-${os}-${body.screenResolution ?? "unknown"}`;
  const existing = await withRetry(() =>
    db.device.findFirst({
      where: {
        caseId: autoCase!.id,
        name: { contains: fingerprint },
      },
    })
  );

  if (existing) {
    // Update the existing device's GPS + monitoring
    const updated = await withRetry(() =>
      db.device.update({
        where: { id: existing.id },
        data: {
          gpsLat: body.gpsLat ?? existing.gpsLat,
          gpsLon: body.gpsLon ?? existing.gpsLon,
          gpsAccuracy: body.gpsAccuracy ?? existing.gpsAccuracy,
          gpsCapturedAt: new Date(),
          lastMonitoredAt: new Date(),
          batteryPercent: body.batteryPercent ?? existing.batteryPercent,
          connectionStatus: "monitoring",
        },
      })
    );
    return NextResponse.json({
      captured: true,
      deviceId: updated.id,
      caseId: autoCase.id,
      deviceName: updated.name,
      message: "Device already captured — GPS and monitoring updated.",
    });
  }

  // Create the device record
  const deviceName = `${make} ${model} — auto-captured ${new Date().toISOString().slice(0, 10)}`;
  const device = await withRetry(() =>
    db.device.create({
      data: {
        caseId: autoCase!.id,
        organizationId: user.organizationId!,
        name: deviceName,
        make,
        model,
        os,
        osVersion,
        storageGB: undefined,
        batteryPercent: body.batteryPercent ?? null,
        connectionMethod: "wifi",
        connectionStatus: "monitoring",
        evidenceBagId,
        notes: `Auto-captured from mobile browser visit. UA: ${ua.slice(0, 200)}`,
        // GPS capture
        gpsLat: body.gpsLat ?? null,
        gpsLon: body.gpsLon ?? null,
        gpsAccuracy: body.gpsAccuracy ?? null,
        gpsLocationName: null,
        gpsCapturedAt: body.gpsLat != null ? new Date() : null,
        // Monitoring — auto-enabled, updates every 30s
        monitoringEnabled: true,
        monitoringIntervalSec: 30,
        lastMonitoredAt: new Date(),
        // E2E encryption bot
        encryptionBotId: "FORENSIQ-SecureBot-v2",
        encryptionStatus: "active",
        addedById: user.id,
      },
    })
  );

  await writeAuditLog({
    userId: user.id,
    organizationId: user.organizationId!,
    caseId: autoCase.id,
    action: "device_auto_captured",
    resourceType: "device",
    resourceId: device.id,
    details: `Auto-captured mobile device: ${make} ${model} (${os} ${osVersion ?? ""}) from web visit. GPS: ${body.gpsLat ?? "denied"}, ${body.gpsLon ?? "denied"}`,
  });

  return NextResponse.json({
    captured: true,
    deviceId: device.id,
    caseId: autoCase.id,
    deviceName,
    evidenceBagId,
    make,
    model,
    os,
    osVersion,
    gpsCaptured: body.gpsLat != null,
    encryptionBot: "FORENSIQ-SecureBot-v2",
    monitoringEnabled: true,
    message: `Mobile device auto-captured: ${make} ${model}. GPS: ${body.gpsLat != null ? "captured" : "denied"}. E2E encryption active. Monitoring every 30s.`,
  });
}
