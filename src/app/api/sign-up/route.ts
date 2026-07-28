import { NextResponse } from "next/server";
import { db, withRetry } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Sign-up: registers a new user account with email + name + password.
// The first user to sign up becomes the single platform admin. All
// subsequent users are created with the "investigator" role (no admin
// escalation is possible from this endpoint).
export async function POST(req: Request) {
  const { email, name, password } = (await req.json()) as {
    email: string;
    name: string;
    password: string;
  };

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }
  if (name.trim().length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase();

  const existing = await withRetry(() =>
    db.user.findUnique({
      where: { email: normalizedEmail },
    })
  );
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  // The very first user in the entire database becomes the single admin.
  const userCount = await withRetry(() => db.user.count());
  const role = userCount === 0 ? "admin" : "investigator";

  const user = await withRetry(() =>
    db.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        role,
        mfaEnabled: false,
        lastActive: new Date(),
        tokenIdentifier: `email:${normalizedEmail}`,
      },
      include: { organization: true },
    })
  );

  await setSessionCookie(user.id);

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
