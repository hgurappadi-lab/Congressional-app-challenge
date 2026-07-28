"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { lora } from "@/lib/fonts";
import {
  MapPin,
  Utensils,
  User,
  Heart,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  Leaf,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasGuestProfile } from "@/lib/profile";
import ProfileShortcut from "@/components/ProfileShortcut";
import WelcomeModal from "@/components/WelcomeModal";

const NAV_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/map", label: "Explore" },
  { href: "/map?mode=find-dish", label: "Find a Dish" },
  { href: "/favorites", label: "Favorites" },
];

// Soft rolling-hills motif for the Explore Nearby card — decorative only.
function HillsIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-accent opacity-25"
    >
      <path fill="currentColor" d="M0,70 C60,40 120,90 180,60 C230,38 270,55 300,45 L300,120 L0,120 Z" />
      <path fill="currentColor" d="M0,95 C80,75 160,105 300,80 L300,120 L0,120 Z" opacity="0.6" />
      <line x1="40" y1="55" x2="40" y2="30" stroke="currentColor" strokeWidth="2" />
      <circle cx="40" cy="26" r="7" fill="currentColor" />
      <line x1="255" y1="48" x2="255" y2="20" stroke="currentColor" strokeWidth="2" />
      <circle cx="255" cy="16" r="8" fill="currentColor" />
    </svg>
  );
}

// Simple dish-cloche motif for the Find a Dish card — decorative only.
function ClocheIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 120"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-accent opacity-25"
    >
      <path fill="currentColor" d="M40,95 A70,55 0 0 1 180,95 Z" />
      <rect x="30" y="93" width="160" height="8" rx="4" fill="currentColor" />
      <circle cx="230" cy="35" r="4" fill="currentColor" />
      <circle cx="255" cy="55" r="3" fill="currentColor" />
      <circle cx="215" cy="60" r="2.5" fill="currentColor" />
    </svg>
  );
}

function ActionCard({ href, icon: Icon, title, description, illustration }) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-56 flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-pale-green to-card p-6 shadow-sm transition-colors hover:border-accent"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-soft-green text-primary">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className={`${lora.className} text-xl font-semibold text-text`}>{title}</span>
      <span className="max-w-[75%] text-sm text-text-secondary">{description}</span>

      {illustration === "hills" ? <HillsIllustration /> : <ClocheIllustration />}

      <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform group-hover:translate-x-0.5">
        <ArrowRight aria-hidden="true" className="h-5 w-5" />
      </span>
    </Link>
  );
}

// Home — the "what are you looking for today" hub. No allergy evidence
// lives here at all, per the redesign spec; it's just a profile summary
// (in the header pill), the two primary actions, and secondary links.
export default function HomePageClient() {
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user: loadedUser },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(loadedUser);
      setCheckedAuth(true);
      setShowWelcome(!loadedUser && !hasGuestProfile());
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="relative flex-1 bg-page">
      {showWelcome ? <WelcomeModal /> : null}
      <div
        aria-hidden={showWelcome || undefined}
        className={showWelcome ? "pointer-events-none select-none blur-sm" : undefined}
      >
      <section className="relative flex min-h-[560px] flex-col overflow-hidden bg-[#0d140f] sm:min-h-[640px]">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/home-hero.png"
            alt="A grilled chicken salad with broccoli, tomatoes, and fresh herbs"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pb-20 pt-8 sm:px-10 lg:pb-28">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-semibold text-white">
                C
              </span>
              <span className="text-lg font-semibold text-white">ClearPlate</span>
            </div>

            <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    link.label === "Home"
                      ? "border-b-2 border-accent pb-1 text-white"
                      : "pb-1 hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <ProfileShortcut />
          </div>

          <div className="flex flex-1 items-center justify-center text-center">
            <h1 className={`${lora.className} text-5xl leading-[1.05] text-white sm:text-6xl`}>
              Food that <span className="italic text-accent">fits</span> you.
            </h1>
          </div>
        </div>

        <a
          href="#discover"
          aria-label="Scroll to what you can do next"
          className="absolute bottom-6 left-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 sm:flex"
        >
          <ChevronDown aria-hidden="true" className="h-5 w-5" />
        </a>

        <svg
          aria-hidden="true"
          viewBox="0 0 1024 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-pale-green sm:h-20"
        >
          <path fill="currentColor" d="M0,55 C260,110 640,0 1024,60 L1024,100 L0,100 Z" />
        </svg>
        <Leaf
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 right-[12%] z-10 h-5 w-5 text-primary opacity-70"
        />
      </section>

      <div
        id="discover"
        className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-8 sm:px-10 sm:py-10"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className={`${lora.className} text-3xl leading-[1.1] text-text sm:text-4xl`}>
            What are you looking for <span className="italic text-primary">today?</span>
          </h2>
          <p className="max-w-md text-base text-text-secondary">
            Find dishes and restaurants that fit your allergies and dietary needs.
          </p>
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
            <p className="max-w-sm text-xs text-text-muted">
              Evidence-based. Allergy-conscious ingredients and preparation with the restaurant.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ActionCard
            href="/map"
            icon={MapPin}
            title="Explore Nearby"
            description="Browse restaurants near you, ranked for your profile."
            illustration="hills"
          />
          <ActionCard
            href="/map?mode=find-dish"
            icon={Utensils}
            title="Find a Dish"
            description="Search for a specific craving or dish nearby."
            illustration="cloche"
          />
        </div>

        <div className="grid divide-y divide-border rounded-2xl border border-border bg-card shadow-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <Link href="/profile" className="flex min-h-11 items-center gap-3 p-5 hover:bg-surface">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
              <User aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="flex flex-col">
              <span className="font-medium text-text">Edit profile</span>
              <span className="text-sm text-text-secondary">Update your allergies and preferences</span>
            </span>
          </Link>
          <Link href="/favorites" className="flex min-h-11 items-center gap-3 p-5 hover:bg-surface">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
              <Heart aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="flex flex-col">
              <span className="font-medium text-text">Favorites</span>
              <span className="text-sm text-text-secondary">View your saved dishes and restaurants</span>
            </span>
          </Link>
        </div>

        {checkedAuth ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-text-muted">
            {user ? (
              <>
                <span>Signed in as {user.email}</span>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm text-text-secondary hover:border-accent"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <span>Browsing as a guest — your profile is saved on this device only.</span>
                <Link href="/auth/signin" className="font-medium text-primary hover:text-primary-hover">
                  Sign in
                </Link>
              </>
            )}
          </div>
        ) : null}
      </div>
      </div>
    </main>
  );
}
