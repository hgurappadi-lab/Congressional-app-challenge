"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/nav-links";

// Persistent site-wide nav — every page except a focused few gets this for
// free via RootLayout, instead of each page having to build its own way
// to reach the rest of the app. Reuses NAV_LINKS (src/lib/nav-links.js),
// the same list /home's own hero nav uses, plus a Profile link that hero
// doesn't need (it already has a ProfileShortcut pill).
// Hidden on "/" and "/home" — its hero already has an equivalent nav, this
// would just duplicate it.
const HIDDEN_ON = new Set(["/", "/home"]);
const HEADER_LINKS = [...NAV_LINKS, { href: "/profile", label: "Profile" }];

function isActive(pathname, href) {
  const [hrefPath] = href.split("?");
  return pathname === hrefPath;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (HIDDEN_ON.has(pathname)) return null;

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/home" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white">
            C
          </span>
          <span className="text-base font-semibold text-text">ClearPlate</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(pathname, link.href)
                  ? "border-b-2 border-primary pb-0.5 text-primary"
                  : "pb-0.5 text-text-secondary hover:text-text"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-text sm:hidden"
        >
          {menuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <nav className="flex flex-col gap-1 border-t border-border px-6 py-3 sm:hidden">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`min-h-11 rounded-lg px-2 py-2 text-sm font-medium ${
                isActive(pathname, link.href) ? "bg-soft-green text-primary" : "text-text-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
