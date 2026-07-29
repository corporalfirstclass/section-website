import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cmsPages = sqliteTable("cms_pages", {
  slug: text("slug").primaryKey(),
  draftHtml: text("draft_html").notNull(),
  publishedHtml: text("published_html"),
  updatedAt: integer("updated_at").notNull(),
  publishedAt: integer("published_at"),
  updatedBy: text("updated_by").notNull(),
});

export const enquiries = sqliteTable("enquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  contactNumber: text("contact_number"),
  company: text("company"),
  message: text("message").notNull(),
  deliveryStatus: text("delivery_status").notNull().default("stored"),
  createdAt: integer("created_at").notNull(),
});

export const cmsCollections = sqliteTable("cms_collections", {
  key: text("key").primaryKey(),
  draftJson: text("draft_json").notNull(),
  publishedJson: text("published_json"),
  updatedAt: integer("updated_at").notNull(),
  publishedAt: integer("published_at"),
  updatedBy: text("updated_by").notNull(),
});
