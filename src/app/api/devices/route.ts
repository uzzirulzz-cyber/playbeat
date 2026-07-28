import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrg, writeAuditLog } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireOrg();
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");

  const devices = await db.device.findMany({
    where: {
      organizationId: user.organizationId!,
      ...(caseId ? { caseId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { acquisitions: true, scanSessions: true, evidenceItems: true },
      },
      acquisitions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          performedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json(
    devices.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      acquisitions: d.acquisitions.map((a) => ({
        ...a,
        startedAt: a.startedAt.toISOString(),
        completedAt: a.completedAt?.toISOString() ?? null,
        integrityVerifiedAt: a.integrityVerifiedAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    }))
  );
}

export async function POST(req: Request) {
  const user = await requireOrg();
  const body = (await req.json()) as {
    caseId: string;
    name: string;
    make: string;
    model: string;
    os: string;
    osVersion?: string;
    serialNumber?: string;
    imei?: string;
    storageGB?: number;
    batteryPercent?: number;
    connectionMethod: string;
    notes?: string;
  };

  // Validate case belongs to org
  const c = await db.case.findFirst({
    where: { id: body.caseId, organizationId: user.organizationId! },
  });
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  // Generate evidence bag ID
  const evidenceBagId = `EV-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const device = await db.device.create({
    data: {
      caseId: body.caseId,
      organizationId: user.organizationId!,
      name: body.name,
      make: body.make,
      model: body.model,
      os: body.os,
      osVersion: body.osVersion,
      serialNumber: body.serialNumber,
      imei: body.imei,
      storageGB: body.storageGB,
      batteryPercent: body.batteryPercent,
      connectionMethod: body.connectionMethod,
      connectionStatus: "connected",
      evidenceBagId,
      notes: body.notes,
      addedById: user.id,
    },
    include: {
      _count: {
        select: { acquisitions: true, scanSessions: true, evidenceItems: true },
      },
    },
  });

  await writeAuditLog({
    userId: user.id,
    organizationId: user.organizationId!,
    caseId: body.caseId,
    action: "device_added",
    resourceType: "device",
    resourceId: device.id,
    details: `Added device ${device.make} ${device.model} (${device.evidenceBagId}) via ${body.connectionMethod}`,
  });

  return NextResponse.json({
    ...device,
    createdAt: device.createdAt.toISOString(),
    updatedAt: device.updatedAt.toISOString(),
  });
}
