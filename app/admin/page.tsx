import { requireChatGPTUser } from "../chatgpt-auth";
import Editor from "./editor";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const isSectionEditor = user.email.toLowerCase().endsWith("@wearesection.com");

  if (!isSectionEditor) {
    return (
      <main className="cms-shell cms-message">
        <p className="cms-kicker">Section CMS</p>
        <h1>This account does not have editing access.</h1>
        <p>Please sign in using your @wearesection.com account.</p>
      </main>
    );
  }

  return <Editor userEmail={user.email} />;
}
