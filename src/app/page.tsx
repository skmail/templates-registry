import Link from "next/link";
import { api } from "~/trpc/server";

const TEMPLATE_META: Record<
  string,
  {
    bg: string;
    iconBg: string;
    iconText: string;
    accent: string;
    accentHover: string;
    glow: string;
    tags: string[];
    tagline: string;
  }
> = {
  nextjs: {
    bg: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
    iconBg: "bg-white",
    iconText: "text-gray-900",
    accent: "text-white",
    accentHover: "group-hover:text-blue-300",
    glow: "group-hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]",
    tags: ["Next.js", "tRPC", "Prisma", "Tailwind"],
    tagline: "Full-stack, type-safe, ready to ship",
  },
  "express-api": {
    bg: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600",
    iconBg: "bg-white",
    iconText: "text-emerald-600",
    accent: "text-white",
    accentHover: "group-hover:text-emerald-100",
    glow: "group-hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)]",
    tags: ["Express", "TypeScript", "Bun"],
    tagline: "Lightweight API, zero bloat",
  },
  "threejs-vite": {
    bg: "bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700",
    iconBg: "bg-white",
    iconText: "text-violet-600",
    accent: "text-white",
    accentHover: "group-hover:text-violet-200",
    glow: "group-hover:shadow-[0_20px_60px_-15px_rgba(139,92,246,0.3)]",
    tags: ["Three.js", "React", "Vite", "Tailwind"],
    tagline: "Bring ideas to life in 3D",
  },
  "autonomous-agents": {
    bg: "bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600",
    iconBg: "bg-white",
    iconText: "text-rose-600",
    accent: "text-white",
    accentHover: "group-hover:text-orange-100",
    glow: "group-hover:shadow-[0_20px_60px_-15px_rgba(244,63,94,0.3)]",
    tags: ["Claude", "Agents", "Workflow"],
    tagline: "Let AI build it for you",
  },
};

const FALLBACK = {
  bg: "bg-gradient-to-br from-gray-400 to-gray-500",
  iconBg: "bg-white",
  iconText: "text-gray-600",
  accent: "text-white",
  accentHover: "",
  glow: "",
  tags: [] as string[],
  tagline: "",
};

export default async function Home() {
  const templates = await api.template.list();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-brand-50/60 via-white to-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-12 right-1/4 h-72 w-72 rounded-full bg-violet-200/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-200/15 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-600">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {templates.length} templates ready to go
          </div>
          <h1
            className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            What will you{" "}
            <span className="bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent">
              build
            </span>{" "}
            today?
          </h1>
          <p
            className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-gray-500"
            style={{ textWrap: "pretty" } as React.CSSProperties}
          >
            Production-ready templates, configured in seconds. Pick a stack,
            name your project, and start coding.
          </p>
        </div>
      </section>

      {/* Templates */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {templates.map((template) => {
            const meta = TEMPLATE_META[template.id] ?? FALLBACK;
            return (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className={`group relative overflow-hidden rounded-xl ${meta.bg} ${meta.glow} p-4 shadow-md transition-all duration-300 hover:-translate-y-0.5`}
              >
                {/* Decorative shapes */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/[0.07]" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/[0.05]" aria-hidden="true" />

                <div className="relative flex items-start gap-3.5">
                  {/* Icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.iconBg} shadow`}>
                    <span className={`text-sm font-extrabold ${meta.iconText}`}>
                      {template.name.charAt(0)}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-[14px] font-bold text-white">
                        {template.name}
                      </h2>
                      <span className="shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 font-mono text-[9px] font-medium text-white/60">
                        v{template.version}
                      </span>
                    </div>

                    <p className="mt-0.5 text-[12px] font-medium text-white/70">
                      {meta.tagline}
                    </p>

                    {/* Tags */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {meta.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/75"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="mt-1 h-4 w-4 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
