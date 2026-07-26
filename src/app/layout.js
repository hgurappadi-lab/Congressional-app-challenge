import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "ClearPlate — Allergy-Aware Food Discovery",
  description:
    "Find nearby dishes and restaurants based on your allergies, dietary restrictions, and cravings.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-page text-text">
        {children}
      </body>
    </html>
  );
}
