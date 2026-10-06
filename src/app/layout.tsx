import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Figtree } from "next/font/google";
import "./globals.css";

const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "PMHCOSMETICS: Beauty, your way", template: "%s · PMHCOSMETICS" },
  description: "Skincare, makeup and beauty essentials carefully selected for you.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FDFAFB" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
