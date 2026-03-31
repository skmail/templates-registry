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
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <TRPCReactProvider>
          {/* Nav */}
          <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
            <nav
              className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6"
              aria-label="Main"
            >
              <Link
                href="/"
                className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-gray-900"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-[12px] font-extrabold text-white shadow-sm shadow-brand-500/30">
                  T
                </span>
                Registry
              </Link>

              <div className="flex items-center gap-1 text-[13px] font-medium">
                <Link
                  href="/"
                  className="rounded-lg px-3 py-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Templates
                </Link>
                {session?.user && (
                  <Link
                    href="/projects"
                    className="rounded-lg px-3 py-1.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    My Projects
                  </Link>
                )}
              </div>

              <div className="flex-1" />

              {session?.user ? (
                <div className="flex items-center gap-3">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={`${session.user.name ?? "User"}'s avatar`}
                      width={28}
                      height={28}
                      className="rounded-full ring-2 ring-gray-100"
                    />
                  )}
                  <span className="hidden text-[13px] font-medium text-gray-600 sm:inline">
                    {session.user.name}
                  </span>
                  <Link
                    href="/api/auth/signout"
                    className="rounded-lg px-2.5 py-1 text-[12px] text-gray-400 transition-colors hover:text-gray-600"
                  >
                    Sign&nbsp;Out
                  </Link>
                </div>
              ) : (
                <Link
                  href="/api/auth/signin"
                  className="rounded-lg bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.97]"
                >
                  Sign&nbsp;In
                </Link>
              )}
            </nav>
          </header>

          <main>{children}</main>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
