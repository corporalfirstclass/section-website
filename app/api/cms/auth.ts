import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "section_cms_session";

function secret() {
  const value = process.env.CMS_SESSION_SECRET;
  if (!value) throw new Error("CMS_SESSION_SECRET is not configured");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createCmsSession(email: string) {
  const payload = Buffer.from(
    JSON.stringify({
      email: email.trim().toLowerCase(),
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyCmsSession(value?: string | null): string | null {
  if (!value) return null;
  const [payload, receivedSignature] = value.split(".");
  if (!payload || !receivedSignature) return null;
  const expected = signature(payload);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(receivedSignature);
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return null;
  }
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { email?: string; expiresAt?: number };
    if (
      !decoded.email ||
      !decoded.expiresAt ||
      decoded.expiresAt < Date.now()
    ) {
      return null;
    }
    return decoded.email;
  } catch {
    return null;
  }
}

function cookieValue(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));
  return match ? decodeURIComponent(match.slice(cookieName.length + 1)) : null;
}

export function requireSectionEditor(request: Request): string {
  const email = verifyCmsSession(cookieValue(request));
  if (!email) {
    throw Response.json({ error: "CMS sign-in required" }, { status: 401 });
  }
  return email;
}

export { cookieName as cmsSessionCookieName };
