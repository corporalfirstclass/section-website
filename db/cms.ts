import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type CmsPage = {
  slug: string;
  draftHtml: string;
  publishedHtml: string | null;
  updatedAt: number;
  publishedAt: number | null;
  updatedBy: string;
};

function database() {
  if (!getApps().length) initializeApp();
  return getFirestore();
}

export async function ensureCmsSchema() {
  database();
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  const snapshot = await database()
    .collection("cms_pages")
    .doc(slug || "home")
    .get();
  return snapshot.exists ? (snapshot.data() as CmsPage) : null;
}

export async function saveDraft(
  slug: string,
  html: string,
  userEmail: string,
) {
  const now = Date.now();
  await database().collection("cms_pages").doc(slug || "home").set(
    { slug, draftHtml: html, updatedAt: now, updatedBy: userEmail },
    { merge: true },
  );
}

export async function publishDraft(slug: string, userEmail: string) {
  const now = Date.now();
  const ref = database().collection("cms_pages").doc(slug || "home");
  const snapshot = await ref.get();
  if (!snapshot.exists || !snapshot.data()?.draftHtml) return false;
  await ref.set(
    {
      publishedHtml: snapshot.data()?.draftHtml,
      publishedAt: now,
      updatedAt: now,
      updatedBy: userEmail,
    },
    { merge: true },
  );
  return true;
}

export async function storeEnquiry(input: {
  name: string;
  email: string;
  contactNumber?: string;
  company?: string;
  message: string;
  deliveryStatus: string;
}) {
  await database().collection("enquiries").add({
    ...input,
    contactNumber: input.contactNumber ?? null,
    company: input.company ?? null,
    createdAt: Date.now(),
  });
}

export async function listEnquiries() {
  const snapshot = await database()
    .collection("enquiries")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getCollection(key: string) {
  const snapshot = await database().collection("cms_collections").doc(key).get();
  return snapshot.exists ? snapshot.data() : null;
}

export async function saveCollectionDraft(
  key: string,
  value: unknown,
  userEmail: string,
) {
  await database().collection("cms_collections").doc(key).set(
    {
      key,
      draft_json: JSON.stringify(value),
      updated_at: Date.now(),
      updated_by: userEmail,
    },
    { merge: true },
  );
}

export async function publishCollection(key: string, userEmail: string) {
  const now = Date.now();
  const ref = database().collection("cms_collections").doc(key);
  const snapshot = await ref.get();
  if (!snapshot.exists || !snapshot.data()?.draft_json) return false;
  await ref.set(
    {
      published_json: snapshot.data()?.draft_json,
      published_at: now,
      updated_at: now,
      updated_by: userEmail,
    },
    { merge: true },
  );
  return true;
}
