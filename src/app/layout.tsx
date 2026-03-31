import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { TRPCReactProvider } from "~/trpc/react";
import { auth } from "~/server/auth";

export const metadata: Metadata = {
  title: "Template Registry",
  description: "Scaffold projects from predefined templates",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
        <TRPCReactProvider>
          {/* Nav */}
          <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-[#09090b]/90 backdrop-blur-lg backdrop-saturate-150">
            <nav
              className="mx-auto flex h-12 max-w-[1080px] items-center gap-6 px-5"
              aria-label="Main"
            >
              {/* Logo */}
              <Link
                href="/"
                className="mr-2 flex items-center gap-2.5 text-[14px] font-semibold tracking-tight text-white"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[11px] font-bold text-black">
                  T
                </span>
                Registry
              </Link>

              {/* Links */}
              <div className="flex items-center gap-0.5 text-[13px]">
                <Link
                  href="/"
                  className="rounded-md px-2.5 py-1 text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-white"
                >
                  Templates
                </Link>
                {session?.user && (
                  <Link
                    href="/projects"
                    className="rounded-md px-2.5 py-1 text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-white"
                  >
                    Projects
                  </Link>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Auth */}
              {session?.user ? (
                <div className="flex items-center gap-2.5">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={`${session.user.name ?? "User"}'s avatar`}
                      width={22}
                      height={22}
                      className="rounded-full ring-1 ring-zinc-700"
                    />
                  )}
                  <span className="hidden text-[13px] text-zinc-500 sm:inline">
                    {session.user.name}
                  </span>
                  <Link
                    href="/api/auth/signout"
                    className="rounded-md px-2 py-1 text-[12px] text-zinc-600 transition-colors hover:text-zinc-300"
                  >
                    Sign&nbsp;Out
                  </Link>
                </div>
              ) : (
                <Link
                  href="/api/auth/signin"
                  className="rounded-md bg-white px-3 py-1 text-[13px] font-medium text-zinc-900 transition-all hover:bg-zinc-200 active:scale-[0.97]"
                >
                  Sign&nbsp;In
                </Link>
              )}
            </nav>
          </header>

          <main className="mx-auto max-w-[1080px] px-5 py-8 sm:py-12">
            {children}
          </main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
