import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSessionCookie, verifyPassword, writeAuditLog } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Sign-in: verifies email + password against the stored bcrypt hash.
export async function POST(req: Request) {
  const { email, password } = (await req.json()) as {
    email: string;
    password: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { organization: true },
  });

  // Always run a hash comparison to keep timing constant even when the
  // user doesn't exist (mitigates user-enumeration attacks).
  const dummyHash =
    "$2a$12$0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const ok = await verifyPassword(password, user?.passwordHash ?? dummyHash);

  if (!user || !ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastActive: new Date() },
  });

  await setSessionCookie(user.id);

  if (user.organizationId) {
    await writeAuditLog({
      userId: user.id,
      organizationId: user.organizationId,
      action: "user_signed_in",
      resourceType: "user",
      resourceId: user.id,
      details: `User ${user.email} signed in`,
    });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      organizationId: user.organizationId,
      mfaEnabled: user.mfaEnabled,
      lastActive: user.lastActive?.toISOString() ?? null,
      tokenIdentifier: user.tokenIdentifier,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    organization: user.organization
      ? {
          id: user.organization.id,
          name: user.organization.name,
          licenseType: user.organization.licenseType,
        }
      : null,
  });
}
