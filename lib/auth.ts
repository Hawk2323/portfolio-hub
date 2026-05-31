import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "portfolio_hub_session";
const SESSION_MAX_AGE = 60 * 60 * 12;

function getSecret() {
  return process.env.SESSION_SECRET ?? "";
}

export function hasAdminConfig() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET);
}

export function assertAdminConfig() {
  if (!hasAdminConfig()) {
    throw new Error("Admin is not configured. Set ADMIN_PASSWORD and SESSION_SECRET.");
  }
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionValue() {
  assertAdminConfig();
  const payload = JSON.stringify({
    sub: "admin",
    nonce: randomBytes(16).toString("base64url"),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionValue(value?: string) {
  if (!value || !hasAdminConfig()) return false;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return false;

  const expected = sign(encoded);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function verifyPassword(candidate: string) {
  assertAdminConfig();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const candidateBuffer = Buffer.from(candidate);
  const passwordBuffer = Buffer.from(password);
  if (candidateBuffer.length !== passwordBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, passwordBuffer);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  };
}

export async function isAuthenticatedFromCookies() {
  const store = await cookies();
  return verifySessionValue(store.get(SESSION_COOKIE)?.value);
}

export function isAuthenticatedRequest(request: NextRequest) {
  return verifySessionValue(request.cookies.get(SESSION_COOKIE)?.value);
}
