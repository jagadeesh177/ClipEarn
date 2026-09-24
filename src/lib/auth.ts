import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { User, UserRole, UserStatus } from "@prisma/client";

const JWT_SECRET = process.env.SESSION_SECRET || "clipearn_ultra_secure_jwt_session_secret_change_in_prod";
const COOKIE_NAME = "clipearn_session";

export interface SessionPayload {
  userId: string;
  role: UserRole;
  username: string;
  email?: string | null;
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const ALLOWED_ADMIN_EMAILS = [
  "aronyesh63@gmail.com",
  "easalajagadeesh@gmail.com",
] as const;

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ALLOWED_ADMIN_EMAILS.some((adm) => adm.toLowerCase().trim() === normalized);
}

export async function ensureRealAdmins(): Promise<void> {
  const realAdmins = [
    { email: "aronyesh63@gmail.com", username: "AronAdmin", pass: "Aron@2006", ref: "ADMINARON01" },
    { email: "easalajagadeesh@gmail.com", username: "JagadeeshAdmin", pass: "Jazz@2006", ref: "ADMINJAZZ01" },
  ];

  for (const adm of realAdmins) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: adm.email },
      });
      if (!existing) {
        const hash = await hashPassword(adm.pass);
        await prisma.user.create({
          data: {
            email: adm.email,
            username: adm.username,
            password_hash: hash,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            referral_code: adm.ref,
          },
        });
      } else if (!existing.password_hash) {
        const hash = await hashPassword(adm.pass);
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            password_hash: hash,
            status: UserStatus.ACTIVE,
          },
        });
      }
    } catch {
      // Ignore transient errors
    }
  }

  // Clean up legacy demo admin & demo manager accounts
  try {
    const aronUser = await prisma.user.findUnique({ where: { email: "aronyesh63@gmail.com" } });
    if (aronUser) {
      const demoUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { in: ["admin@clipearn.com", "manager@clipearn.com", "clipper@clipearn.com"] } },
            { username: { in: ["DemoAdmin", "DemoManager", "DemoClipper"] } },
          ],
        },
      });
      for (const demoUser of demoUsers) {
        await prisma.campaign.updateMany({
          where: { created_by: demoUser.id },
          data: { created_by: aronUser.id },
        });
        await prisma.auditLog.updateMany({
          where: { actor_id: demoUser.id },
          data: { actor_id: aronUser.id },
        });
        await prisma.managerAccessKey.updateMany({
          where: { created_by: demoUser.id },
          data: { created_by: aronUser.id },
        });
        await prisma.managerAccessKey.updateMany({
          where: { used_by: demoUser.id },
          data: { used_by: null, status: "REVOKED" },
        });
        await prisma.user.delete({ where: { id: demoUser.id } }).catch(() => {});
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        social_accounts: true,
      },
    });

    if (!user || user.status === UserStatus.BANNED) {
      return null;
    }

    // Completely disallow any legacy demo identities
    if (
      user.email === "admin@clipearn.com" ||
      user.email === "manager@clipearn.com" ||
      user.email === "clipper@clipearn.com" ||
      user.username === "DemoAdmin" ||
      user.username === "DemoManager" ||
      user.username === "DemoClipper"
    ) {
      return null;
    }

    // Strict Role Enforcement:
    // 1. Managers strictly remain Managers and must NEVER be elevated or promoted to Admin.
    if (payload.role === UserRole.MANAGER || user.role === UserRole.MANAGER) {
      user.role = UserRole.MANAGER;
    } else if (user.role === UserRole.ADMIN && !isAllowedAdminEmail(user.email)) {
      // 2. Only the two designated real Admin accounts are allowed the ADMIN role in active sessions.
      user.role = UserRole.CLIPPER;
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(options?: { allowSuspended?: boolean }): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (!options?.allowSuspended && user.status === UserStatus.SUSPENDED) {
    throw new Error(`ACCOUNT_SUSPENDED: ${user.suspension_reason || "Account has been suspended by management."}`);
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[], options?: { allowSuspended?: boolean }): Promise<User> {
  const user = await requireAuth(options);
  if (!options?.allowSuspended && user.status !== UserStatus.ACTIVE) {
    throw new Error(`ACCOUNT_SUSPENDED: ${user.suspension_reason || "Account has been suspended by management."}`);
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  // Exact Admin Access Protection:
  // If the user's role is ADMIN, strictly enforce that they are one of the two authorized Admin accounts.
  if (user.role === UserRole.ADMIN && !isAllowedAdminEmail(user.email)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export { COOKIE_NAME };
