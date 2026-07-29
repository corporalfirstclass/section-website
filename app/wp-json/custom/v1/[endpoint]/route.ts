const allowedEndpoints = new Set([
  "projects",
  "service-categories",
  "statistics",
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ endpoint: string }> },
) {
  const { endpoint } = await context.params;
  if (!allowedEndpoints.has(endpoint)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const incoming = new URL(request.url);
  const target = new URL(
    `/wp-json/custom/v1/${endpoint}`,
    "https://wearesection.com",
  );
  target.search = incoming.search;

  if (endpoint === "projects") {
    try {
      const collection = await getCollection("projects");
      if (collection?.published_json) {
        return Response.json(JSON.parse(collection.published_json), {
          headers: { "cache-control": "public, max-age=60" },
        });
      }
    } catch {
      // Continue to the production feed until CMS storage is ready.
    }
  }

  const response = await fetch(target, {
    headers: { accept: "application/json" },
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
      "cache-control": "public, max-age=300",
    },
  });
}
import { getCollection } from "../../../../../db/cms";
