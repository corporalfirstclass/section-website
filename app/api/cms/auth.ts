export function requireSectionEditor(request: Request): string {
  const email = request.headers
    .get("oai-authenticated-user-email")
    ?.trim()
    .toLowerCase();

  if (!email || !email.endsWith("@wearesection.com")) {
    throw new Response("Section editor access required", { status: 403 });
  }

  return email;
}
