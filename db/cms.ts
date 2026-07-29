import { env } from "cloudflare:workers";

type CmsPage = {
  slug: string;
  draftHtml: string;
  publishedHtml: string | null;
  updatedAt: number;
  publishedAt: number | null;
  updatedBy: string;
};

function database() {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("CMS database is unavailable");
  return db;
}

export async function ensureCmsSchema() {
  const db = database();
  await db.batch([
    db
      .prepare(
        `CREATE TABLE IF NOT EXISTS cms_pages (
          slug TEXT PRIMARY KEY,
          draft_html TEXT NOT NULL,
          published_html TEXT,
          updated_at INTEGER NOT NULL,
          published_at INTEGER,
          updated_by TEXT NOT NULL
        )`,
      ),
    db
      .prepare(
        `CREATE TABLE IF NOT EXISTS enquiries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          contact_number TEXT,
          company TEXT,
          message TEXT NOT NULL,
          delivery_status TEXT NOT NULL DEFAULT 'stored',
          created_at INTEGER NOT NULL
        )`,
      ),
    db
      .prepare(
        `CREATE TABLE IF NOT EXISTS cms_collections (
          key TEXT PRIMARY KEY,
          draft_json TEXT NOT NULL,
          published_json TEXT,
          updated_at INTEGER NOT NULL,
          published_at INTEGER,
          updated_by TEXT NOT NULL
        )`,
      ),
  ]);
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  await ensureCmsSchema();
  const row = await database()
    .prepare(
      `SELECT slug, draft_html, published_html, updated_at, published_at, updated_by
       FROM cms_pages WHERE slug = ?`,
    )
    .bind(slug)
    .first<{
      slug: string;
      draft_html: string;
      published_html: string | null;
      updated_at: number;
      published_at: number | null;
      updated_by: string;
    }>();

  return row
    ? {
        slug: row.slug,
        draftHtml: row.draft_html,
        publishedHtml: row.published_html,
        updatedAt: row.updated_at,
        publishedAt: row.published_at,
        updatedBy: row.updated_by,
      }
    : null;
}

export async function saveDraft(
  slug: string,
  html: string,
  userEmail: string,
) {
  await ensureCmsSchema();
  const now = Date.now();
  await database()
    .prepare(
      `INSERT INTO cms_pages (slug, draft_html, updated_at, updated_by)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         draft_html = excluded.draft_html,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    )
    .bind(slug, html, now, userEmail)
    .run();
}

export async function publishDraft(slug: string, userEmail: string) {
  await ensureCmsSchema();
  const now = Date.now();
  const result = await database()
    .prepare(
      `UPDATE cms_pages SET
         published_html = draft_html,
         published_at = ?,
         updated_at = ?,
         updated_by = ?
       WHERE slug = ?`,
    )
    .bind(now, now, userEmail, slug)
    .run();

  return result.meta.changes > 0;
}

export async function storeEnquiry(input: {
  name: string;
  email: string;
  contactNumber?: string;
  company?: string;
  message: string;
  deliveryStatus: string;
}) {
  await ensureCmsSchema();
  await database()
    .prepare(
      `INSERT INTO enquiries
       (name, email, contact_number, company, message, delivery_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.name,
      input.email,
      input.contactNumber ?? null,
      input.company ?? null,
      input.message,
      input.deliveryStatus,
      Date.now(),
    )
    .run();
}

export async function listEnquiries() {
  await ensureCmsSchema();
  return database()
    .prepare(
      `SELECT id, name, email, contact_number, company, message,
              delivery_status, created_at
       FROM enquiries ORDER BY created_at DESC LIMIT 100`,
    )
    .all();
}

export async function getCollection(key: string) {
  await ensureCmsSchema();
  return database()
    .prepare(
      `SELECT key, draft_json, published_json, updated_at, published_at, updated_by
       FROM cms_collections WHERE key = ?`,
    )
    .bind(key)
    .first<{
      key: string;
      draft_json: string;
      published_json: string | null;
      updated_at: number;
      published_at: number | null;
      updated_by: string;
    }>();
}

export async function saveCollectionDraft(
  key: string,
  value: unknown,
  userEmail: string,
) {
  await ensureCmsSchema();
  const json = JSON.stringify(value);
  await database()
    .prepare(
      `INSERT INTO cms_collections (key, draft_json, updated_at, updated_by)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         draft_json = excluded.draft_json,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`,
    )
    .bind(key, json, Date.now(), userEmail)
    .run();
}

export async function publishCollection(key: string, userEmail: string) {
  await ensureCmsSchema();
  const now = Date.now();
  const result = await database()
    .prepare(
      `UPDATE cms_collections SET
         published_json = draft_json,
         published_at = ?,
         updated_at = ?,
         updated_by = ?
       WHERE key = ?`,
    )
    .bind(now, now, userEmail, key)
    .run();
  return result.meta.changes > 0;
}
