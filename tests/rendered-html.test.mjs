import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("includes every approved production-mirror route", async () => {
  const snapshots = JSON.parse(
    await readFile(new URL("app/production-snapshots.json", root), "utf8"),
  );

  assert.deepEqual(Object.keys(snapshots).sort(), [
    "",
    "about-us",
    "contact-us",
    "design-tech",
    "our-works",
    "pdpa-policy",
    "privacy-policy",
  ]);

  for (const html of Object.values(snapshots)) {
    assert.match(html, /<!doctype html>/i);
    assert.doesNotMatch(html, /(?:src|href)="\/wp-(?:content|includes)\//i);
  }
});

test("provides a protected draft and publish CMS", async () => {
  const [adminPage, editor, cmsRoute, schema, hosting] = await Promise.all([
    readFile(new URL("app/admin/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/editor.tsx", root), "utf8"),
    readFile(new URL("app/api/cms/pages/[slug]/route.ts", root), "utf8"),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL(".openai/hosting.json", root), "utf8"),
  ]);

  assert.match(adminPage, /requireChatGPTUser/);
  assert.match(adminPage, /@wearesection\.com/);
  assert.match(editor, /Save draft/);
  assert.match(editor, /Publish/);
  assert.match(cmsRoute, /requireSectionEditor/);
  assert.match(schema, /cmsPages/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});

test("stores enquiries and targets the requested inbox", async () => {
  const enquiryRoute = await readFile(
    new URL("app/api/enquiries/route.ts", root),
    "utf8",
  );

  assert.match(enquiryRoute, /corporal@wearesection\.com/);
  assert.match(enquiryRoute, /storeEnquiry/);
  assert.match(enquiryRoute, /RESEND_API_KEY/);
  assert.match(enquiryRoute, /website/);
});
