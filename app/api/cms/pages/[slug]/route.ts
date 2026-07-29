import snapshots from "../../../../production-snapshots.json";
import {
  getCmsPage,
  publishDraft,
  saveDraft,
} from "../../../../../db/cms";
import { requireSectionEditor } from "../../auth";

type SnapshotKey = keyof typeof snapshots;
const allowedSlugs = new Set(Object.keys(snapshots));

function normalizeSlug(value: string) {
  return value === "home" ? "" : value;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    requireSectionEditor(request);
    const { slug: rawSlug } = await context.params;
    const slug = normalizeSlug(rawSlug);
    if (!allowedSlugs.has(slug)) {
      return Response.json({ error: "Page not found" }, { status: 404 });
    }

    const record = await getCmsPage(slug);
    return Response.json({
      slug,
      html: record?.draftHtml ?? snapshots[slug as SnapshotKey],
      publishedAt: record?.publishedAt ?? null,
      updatedAt: record?.updatedAt ?? null,
      updatedBy: record?.updatedBy ?? null,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const editor = requireSectionEditor(request);
    const { slug: rawSlug } = await context.params;
    const slug = normalizeSlug(rawSlug);
    if (!allowedSlugs.has(slug)) {
      return Response.json({ error: "Page not found" }, { status: 404 });
    }

    const body = (await request.json()) as { html?: unknown };
    if (typeof body.html !== "string" || body.html.length < 100) {
      return Response.json({ error: "Invalid page content" }, { status: 400 });
    }
    if (body.html.length > 4_000_000) {
      return Response.json({ error: "Page content is too large" }, { status: 413 });
    }

    await saveDraft(slug, body.html, editor);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const editor = requireSectionEditor(request);
    const { slug: rawSlug } = await context.params;
    const slug = normalizeSlug(rawSlug);
    if (!allowedSlugs.has(slug)) {
      return Response.json({ error: "Page not found" }, { status: 404 });
    }

    const published = await publishDraft(slug, editor);
    if (!published) {
      return Response.json(
        { error: "Save a draft before publishing" },
        { status: 409 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
}
