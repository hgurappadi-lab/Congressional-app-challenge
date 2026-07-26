import { Lora } from "next/font/google";

// Shared serif display font for the pages using the richer, illustrated
// visual treatment (Home, Profile) — see design-system/pages/*.md. Kept as
// a single shared instance so multiple client components can reuse the
// same font object rather than each calling next/font/google separately.
export const lora = Lora({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-lora" });
