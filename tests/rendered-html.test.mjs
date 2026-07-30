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
  const [adminPage, editor, loginRoute, auth, cmsRoute, database] = await Promise.all([
    readFile(new URL("app/admin/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/editor.tsx", root), "utf8"),
    readFile(new URL("app/api/cms/login/route.ts", root), "utf8"),
    readFile(new URL("app/api/cms/auth.ts", root), "utf8"),
    readFile(new URL("app/api/cms/pages/[slug]/route.ts", root), "utf8"),
    readFile(new URL("db/cms.ts", root), "utf8"),
  ]);

  assert.match(adminPage, /verifyCmsSession/);
  assert.match(loginRoute, /CMS_ADMIN_PASSWORD/);
  assert.match(loginRoute, /corporal@wearesection\.com/);
  assert.match(auth, /CMS_SESSION_SECRET/);
  assert.match(auth, /timingSafeEqual/);
  assert.match(editor, /Save draft/);
  assert.match(editor, /Publish/);
  assert.match(cmsRoute, /requireSectionEditor/);
  assert.match(database, /getFirestore/);
  assert.match(database, /cms_pages/);
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

test("keeps the live deployment safeguards enabled", async () => {
  const [packageJson, publicRoute, cmsCss] = await Promise.all([
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("app/[[...slug]]/route.ts", root), "utf8"),
    readFile(new URL("app/admin/admin.css", root), "utf8"),
  ]);
  const packageData = JSON.parse(packageJson);

  assert.equal(packageData.engines.node, "22.x");
  assert.match(packageData.scripts["qa:live"], /lint/);
  assert.match(packageData.scripts["qa:live"], /build/);
  assert.match(packageData.scripts["qa:live"], /test/);
  assert.match(publicRoute, /section-responsive-overrides/);
  assert.match(publicRoute, /x-robots-tag/);
  assert.match(cmsCss, /\.cms-app\{[^}]*overflow-x:hidden/);
  assert.match(cmsCss, /@media\(max-width:760px\)/);
});
