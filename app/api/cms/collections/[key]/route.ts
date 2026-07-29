import {
  getCollection,
  publishCollection,
  saveCollectionDraft,
} from "../../../../../db/cms";
import { requireSectionEditor } from "../../auth";

const allowedKeys = new Set(["projects"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  try {
    requireSectionEditor(request);
    const { key } = await context.params;
    if (!allowedKeys.has(key)) {
      return Response.json({ error: "Collection not found" }, { status: 404 });
    }
    const record = await getCollection(key);
    if (record) {
      return Response.json({
        items: JSON.parse(record.draft_json),
        publishedAt: record.published_at,
      });
    }

    const source = await fetch(
      `https://wearesection.com/wp-json/custom/v1/${key}`,
      {
      headers: { accept: "application/json" },
      },
    );
    return Response.json({ items: await source.json(), publishedAt: null });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  try {
    const editor = requireSectionEditor(request);
    const { key } = await context.params;
    if (!allowedKeys.has(key)) {
      return Response.json({ error: "Collection not found" }, { status: 404 });
    }
    const body = (await request.json()) as { items?: unknown };
    if (!Array.isArray(body.items) || body.items.length > 250) {
      return Response.json({ error: "Invalid collection" }, { status: 400 });
    }
    await saveCollectionDraft(key, body.items, editor);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  try {
    const editor = requireSectionEditor(request);
    const { key } = await context.params;
    if (!allowedKeys.has(key)) {
      return Response.json({ error: "Collection not found" }, { status: 404 });
    }
    const published = await publishCollection(key, editor);
    return published
      ? Response.json({ ok: true })
      : Response.json({ error: "Save a draft first" }, { status: 409 });
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
}
