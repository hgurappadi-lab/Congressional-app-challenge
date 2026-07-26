"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-[26px] font-semibold text-text sm:text-[32px]">Sign in</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-primary hover:text-primary-hover">
            Create one
          </Link>{" "}
          or{" "}
          <Link href="/home" className="font-medium text-primary hover:text-primary-hover">
            continue as guest
          </Link>
          .
        </p>
      </div>

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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-11 rounded-2xl border border-border bg-card px-3.5 py-2 text-base font-normal text-text focus:border-accent"
          />
        </label>

        {status === "error" ? <p className="text-sm text-status-allergen-text">{errorMessage}</p> : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="min-h-11 rounded-2xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
