import snapshots from "../production-snapshots.json";
import { getCmsPage } from "../../db/cms";

type SnapshotKey = keyof typeof snapshots;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await context.params;
  const key = slug.join("/") as SnapshotKey;
  const snapshot = snapshots[key];

  if (!snapshot) {
    return new Response("Not found", { status: 404 });
  }

  let html = snapshot;
  try {
    const cmsPage = await getCmsPage(key);
    if (cmsPage?.publishedHtml) html = cmsPage.publishedHtml;
  } catch {
    // The static mirror remains available while local or hosted storage is
    // being initialized.
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
