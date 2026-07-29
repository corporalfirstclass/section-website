import {
  cmsSessionCookieName,
  createCmsSession,
} from "../auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: unknown;
    password?: unknown;
  };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const allowedEmail = (
    process.env.CMS_ADMIN_EMAIL || "corporal@wearesection.com"
  ).toLowerCase();

  if (
    !process.env.CMS_ADMIN_PASSWORD ||
    email !== allowedEmail ||
    password !== process.env.CMS_ADMIN_PASSWORD
  ) {
    return Response.json(
      { error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  const response = Response.json({ ok: true });
  response.headers.append(
    "set-cookie",
    `${cmsSessionCookieName}=${encodeURIComponent(
      createCmsSession(email),
    )}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`,
  );
  return response;
}

export async function DELETE() {
  const response = Response.json({ ok: true });
  response.headers.append(
    "set-cookie",
    `${cmsSessionCookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
  return response;
}
