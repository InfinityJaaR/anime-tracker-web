import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "AnimeTracker", template: "%s · AnimeTracker" },
  description:
    "Lleva tus listas de anime, mira tus estadísticas, compáralas con tus amigos y descubre qué ver.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-border py-5 text-center text-xs text-muted">
          <nav aria-label="Pie de página" className="mb-2 flex justify-center gap-4">
            <Link href="/privacidad" className="py-2 underline">Privacidad y términos</Link>
            <Link href="/search" className="py-2 underline">Buscar anime</Link>
          </nav>
          AnimeTracker es gratuito. La información de cada anime proviene de MyAnimeList.
        </footer>
      </body>
    </html>
  );
}
