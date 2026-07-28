import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie, writeAuditLog, isValidLicenseFormat, DEMO_LICENSE_KEYS } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ActivateBody {
  mode: "create" | "join";
  orgName?: string;
  licenseKey: string;
  licenseType?: "standard" | "professional" | "enterprise";
  email: string;
  name: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as ActivateBody;

  if (!body.email || !body.licenseKey || !body.name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate license key format. Demo keys always work.
  const isDemoKey = DEMO_LICENSE_KEYS.includes(body.licenseKey);
  if (!isDemoKey && !isValidLicenseFormat(body.licenseKey)) {
    return NextResponse.json(
      { error: "Invalid license key format. Expected FORENSIQ-YYYY-XXXX-XXXX" },
      { status: 400 }
    );
  }

  // Create / fetch user
  let user = await db.user.findUnique({
    where: { email: body.email },
    include: { organization: true },
  });
  if (!user) {
    user = await db.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.mode === "create" ? "admin" : "investigator",
        mfaEnabled: false,
        lastActive: new Date(),
        tokenIdentifier: `email:${body.email}`,
      },
      include: { organization: true },
    });
  } else if (!user.organizationId && body.mode === "create") {
    // Promote to admin if they are creating an org
    user = await db.user.update({
      where: { id: user.id },
      data: { name: body.name || user.name, role: "admin", lastActive: new Date() },
      include: { organization: true },
    });
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: { name: body.name || user.name, lastActive: new Date() },
      include: { organization: true },
    });
  }

  if (user.organizationId) {
    return NextResponse.json(
      { error: "User already belongs to an organization. Sign out first." },
      { status: 400 }
    );
  }

  let organization;
  if (body.mode === "create") {
    // Create new org
    if (!body.orgName) {
      return NextResponse.json({ error: "Organization name required" }, { status: 400 });
    }
    organization = await db.organization.create({
      data: {
        name: body.orgName,
        licenseKey: body.licenseKey,
        licenseType: body.licenseType || "professional",
        activatedById: user.id,
        maxUsers: body.licenseType === "enterprise" ? 50 : body.licenseType === "standard" ? 5 : 15,
      },
    });
    await db.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });
    await writeAuditLog({
      userId: user.id,
      organizationId: organization.id,
      action: "organization_activated",
      resourceType: "organization",
      resourceId: organization.id,
      details: `Activated org "${organization.name}" with license ${body.licenseKey} (${organization.licenseType})`,
    });
  } else {
    // Join existing org by license key
    organization = await db.organization.findUnique({
      where: { licenseKey: body.licenseKey },
    });
    if (!organization) {
      return NextResponse.json(
        { error: "No organization found with that license key" },
        { status: 404 }
      );
    }
    const memberCount = await db.user.count({
      where: { organizationId: organization.id },
    });
    if (memberCount >= organization.maxUsers) {
      return NextResponse.json(
        { error: `Organization has reached its ${organization.maxUsers}-user limit` },
        { status: 400 }
      );
    }
    await db.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    });
    await writeAuditLog({
      userId: user.id,
      organizationId: organization.id,
      action: "user_joined_organization",
      resourceType: "organization",
      resourceId: organization.id,
      details: `User ${user.email} joined organization "${organization.name}"`,
    });
  }

  await setSessionCookie(user.id);

  const freshUser = await db.user.findUnique({
    where: { id: user.id },
    include: { organization: true },
  });

  return NextResponse.json({
    user: {
      id: freshUser!.id,
      email: freshUser!.email,
      name: freshUser!.name,
      avatar: freshUser!.avatar,
      role: freshUser!.role,
      organizationId: freshUser!.organizationId,
      mfaEnabled: freshUser!.mfaEnabled,
      lastActive: freshUser!.lastActive?.toISOString() ?? null,
      tokenIdentifier: freshUser!.tokenIdentifier,
      createdAt: freshUser!.createdAt.toISOString(),
      updatedAt: freshUser!.updatedAt.toISOString(),
    },
    organization: {
      id: organization.id,
      name: organization.name,
      licenseType: organization.licenseType,
    },
  });
}
