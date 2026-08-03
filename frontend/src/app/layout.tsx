import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AssistantWidget } from "@/components/ai/assistant-widget";
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
export const metadata: Metadata = { title: "ThreadMark | B2B Textile Marketplace", description: "Source, compare, and order fabrics with confidence." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}><body>{children}<AssistantWidget/></body></html>; }
