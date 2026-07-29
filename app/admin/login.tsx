"use client";

import { FormEvent, useState } from "react";

export default function CmsLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/cms/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
      }),
    });
    if (response.ok) {
      window.location.reload();
      return;
    }
    const result = (await response.json()) as { error?: string };
    setError(result.error || "Sign-in failed.");
    setBusy(false);
  }

  return (
    <main className="cms-shell cms-message">
      <p className="cms-kicker">Section CMS</p>
      <h1>Sign in to edit the staging website.</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 16, maxWidth: 420 }}>
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            defaultValue="corporal@wearesection.com"
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input name="password" type="password" required />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
