import { cookies } from "next/headers";
import {
  cmsSessionCookieName,
  verifyCmsSession,
} from "../api/cms/auth";
import Editor from "./editor";
import CmsLogin from "./login";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const email = verifyCmsSession(cookieStore.get(cmsSessionCookieName)?.value);
  if (!email) return <CmsLogin />;
  return <Editor userEmail={email} />;
}
