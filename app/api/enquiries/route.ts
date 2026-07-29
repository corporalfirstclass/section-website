import { env } from "cloudflare:workers";
import { listEnquiries, storeEnquiry } from "../../../db/cms";
import { requireSectionEditor } from "../cms/auth";

const destination = "corporal@wearesection.com";

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(request: Request) {
  try {
    requireSectionEditor(request);
    const result = await listEnquiries();
    return Response.json({ enquiries: result.results });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const website = clean(body.website, 200);
  if (website) return Response.json({ ok: true });

  const enquiry = {
    name: clean(body.name, 160),
    email: clean(body.email, 320).toLowerCase(),
    contactNumber: clean(body.contactNumber, 80),
    company: clean(body.company, 200),
    message: clean(body.message, 10_000),
  };

  if (!enquiry.name || !isEmail(enquiry.email) || !enquiry.message) {
    return Response.json(
      { error: "Please complete your name, email and enquiry." },
      { status: 400 },
    );
  }

  const runtime = env as unknown as {
    RESEND_API_KEY?: string;
    ENQUIRY_FROM_EMAIL?: string;
  };
  let deliveryStatus = "stored";

  if (runtime.RESEND_API_KEY && runtime.ENQUIRY_FROM_EMAIL) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${runtime.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: runtime.ENQUIRY_FROM_EMAIL,
        to: [destination],
        reply_to: enquiry.email,
        subject: `Website enquiry from ${enquiry.name}`,
        text: [
          `Name: ${enquiry.name}`,
          `Email: ${enquiry.email}`,
          `Contact number: ${enquiry.contactNumber || "Not provided"}`,
          `Company: ${enquiry.company || "Not provided"}`,
          "",
          enquiry.message,
        ].join("\n"),
      }),
    });
    deliveryStatus = response.ok ? "sent" : "email_failed";
  }

  await storeEnquiry({ ...enquiry, deliveryStatus });

  if (deliveryStatus === "email_failed") {
    return Response.json(
      { error: "Your enquiry was saved, but email delivery was delayed." },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    emailed: deliveryStatus === "sent",
  });
}
