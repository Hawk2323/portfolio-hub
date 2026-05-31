import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionValue, hasAdminConfig, sessionCookieOptions, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasAdminConfig()) {
    return NextResponse.json({ error: "Admin is not configured. Set ADMIN_PASSWORD and SESSION_SECRET." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !verifyPassword(body.password)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE, createSessionValue(), sessionCookieOptions());
  return response;
}
