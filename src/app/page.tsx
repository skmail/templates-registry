import Link from "next/link";
import { api } from "~/trpc/server";

const TEMPLATE_META: Record<
  string,
  { gradient: string; icon: React.ReactNode; tags: string[] }
> = {
  nextjs: {
    gradient: "from-zinc-900 via-zinc-800 to-zinc-900",
    icon: (
      <svg width="28" height="28" viewBox="0 0 180 180" fill="none" aria-hidden="true">
        <mask id="a" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
          <circle cx="90" cy="90" r="90" fill="#000" />
        </mask>
        <g mask="url(#a)">
          <circle cx="90" cy="90" r="90" fill="#000" />
          <path d="M149.508 157.52L69.142 54H54v71.97h12.114V69.384l73.885 95.461a90.304 90.304 0 009.509-7.325z" fill="url(#b)" />
          <rect x="115" y="54" width="12" height="72" fill="url(#c)" />
        </g>
        <defs>
          <linearGradient id="b" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="c" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    ),
    tags: ["Next.js", "tRPC", "Prisma", "Tailwind"],
  },
  "express-api": {
    gradient: "from-emerald-950 via-emerald-900/80 to-zinc-900",
    icon: (
      <span className="text-xl font-bold text-emerald-400" aria-hidden="true">
        Ex
      </span>
    ),
    tags: ["Express", "TypeScript", "Bun"],
  },
  "threejs-vite": {
    gradient: "from-violet-950 via-indigo-900/80 to-zinc-900",
    icon: (
      <span className="text-xl font-bold text-violet-400" aria-hidden="true">
        3D
      </span>
    ),
    tags: ["Three.js", "React", "Vite", "Tailwind"],
  },
  "autonomous-agents": {
    gradient: "from-amber-950 via-orange-900/80 to-zinc-900",
    icon: (
      <span className="text-xl font-bold text-amber-400" aria-hidden="true">
        Ag
      </span>
    ),
    tags: ["Claude", "Agents", "Workflow"],
  },
};

const FALLBACK_META = {
  gradient: "from-zinc-800 to-zinc-900",
  icon: <span className="text-xl font-bold text-zinc-400" aria-hidden="true">?</span>,
  tags: [] as string[],
};

export default async function Home() {
  const templates = await api.template.list();

  return (
    <div>
      {/* Hero */}
      <section className="mb-10">
        <h1
          className="text-[28px] font-semibold tracking-tight text-white sm:text-[32px]"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          Start building faster
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-zinc-500">
          Production-ready project templates. Pick one, fill in the details, and
          have a fully configured project in seconds.
        </p>
      </section>

      {/* Template grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((template) => {
          const meta = TEMPLATE_META[template.id] ?? FALLBACK_META;
          return (
            <Link
              key={template.id}
              href={`/templates/${template.id}`}
              className="card-glow group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/50 transition-all duration-200 hover:border-zinc-700/80 hover:shadow-[0_0_40px_-12px_rgba(255,255,255,0.06)]"
            >
              {/* Colored banner */}
              <div
                className={`relative flex h-28 items-center justify-center bg-gradient-to-r ${meta.gradient}`}
              >
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-black/30 backdrop-blur-sm ring-1 ring-white/10">
                  {meta.icon}
                </div>
                {/* Subtle noise texture */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-white">
                    {template.name}
                  </h2>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                    v{template.version}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {meta.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 pt-3">
                  <span className="tabular-nums text-[12px] text-zinc-600">
                    {template.stepCount}&nbsp;steps
                  </span>
                  <span className="flex items-center gap-1 text-[12px] text-zinc-600 transition-colors group-hover:text-zinc-300">
                    Set up
                    <svg
                      className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
