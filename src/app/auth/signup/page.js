"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | sent | error
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-[26px] font-semibold text-text sm:text-[32px]">Create an account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Saves your allergy profile and favorites across visits. You
          don&apos;t need an account to use the app —{" "}
          <Link href="/home" className="font-medium text-primary hover:text-primary-hover">
            continue as guest
          </Link>{" "}
          instead.
        </p>
      </div>

      {status === "sent" ? (
        <p className="rounded-2xl border border-status-match-border bg-status-match-bg px-4 py-3 text-sm text-status-match-text">
          Check your email for a confirmation link to finish creating your
          account.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 rounded-2xl border border-border bg-card px-3.5 py-2 text-base font-normal text-text focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 rounded-2xl border border-border bg-card px-3.5 py-2 text-base font-normal text-text focus:border-accent"
            />
          </label>

          {status === "error" ? (
            <p className="text-sm text-status-allergen-text">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className="min-h-11 rounded-2xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {status === "loading" ? "Creating account..." : "Create account"}
          </button>
        </form>
      )}

      <p className="text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/auth/signin" className="font-medium text-primary hover:text-primary-hover">
          Sign in
        </Link>
      </p>
    </main>
  );
}
