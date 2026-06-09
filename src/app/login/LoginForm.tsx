"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: "/",
      });
      if (!res?.ok) setError("Username / password salah.");
      else window.location.href = res.url || "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm"
    >
      <h1 className="mb-1 text-xl font-semibold">Login</h1>
      <p className="mb-6 text-sm text-slate-600">
        Masuk untuk mengakses dashboard.
      </p>

      <label className="mb-2 block text-sm font-medium">Username</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-4 w-full rounded-md border px-3 py-2"
        autoComplete="username"
        required
      />

      <label className="mb-2 block text-sm font-medium">Password</label>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 w-full rounded-md border px-3 py-2"
        type="password"
        autoComplete="current-password"
        required
      />

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        disabled={loading}
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}

