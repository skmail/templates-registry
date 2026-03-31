"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

const STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  completed: { dot: "bg-emerald-400", label: "Completed" },
  failed: { dot: "bg-red-400", label: "Failed" },
  running: { dot: "bg-blue-400 animate-pulse", label: "Running" },
  pending: { dot: "bg-zinc-600", label: "Pending" },
};

export function ProjectsList() {
  const { data: projects, isLoading } = api.template.getProjects.useQuery();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-[13px] text-zinc-600">
        Loading&hellip;
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
          <svg className="h-5 w-5 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        </div>
        <p className="text-[14px] text-zinc-400">No projects yet</p>
        <p className="mt-1 text-[13px] text-zinc-600">
          Create your first project from a template.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-9 items-center rounded-lg bg-white px-4 text-[13px] font-medium text-zinc-900 transition-all hover:bg-zinc-200 active:scale-[0.98]"
        >
          Browse Templates
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800/60">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_140px_100px_150px] items-center gap-4 border-b border-zinc-800/40 bg-zinc-900/50 px-5 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Project
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Template
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Status
        </span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Created
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-zinc-800/30">
        {projects.map((project) => (
          <ProjectRow key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

interface ProjectData {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  templateVersion: string;
  status: string;
  projectPath: string | null;
  variables: unknown;
  steps: unknown;
  stepsCompleted: number;
  stepsFailed: number;
  stepsSkipped: number;
  createdAt: Date;
}

function ProjectRow({ project }: { project: ProjectData }) {
  const [open, setOpen] = useState(false);
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.pending!;
  const steps = (project.steps ?? []) as Array<{
    name: string;
    label: string;
    type: string;
    status: string;
    error?: string;
  }>;

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(project.createdAt));

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="grid w-full grid-cols-[1fr_140px_100px_150px] items-center gap-4 px-5 py-3.5 text-left text-[13px] transition-colors hover:bg-zinc-800/20"
      >
        <span className="truncate font-mono font-medium text-zinc-200">
          {project.name}
        </span>
        <span className="truncate text-zinc-500">{project.templateName}</span>
        <span className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          <span className="text-zinc-400">{status.label}</span>
        </span>
        <span className="text-right tabular-nums text-zinc-600">{date}</span>
      </button>

      {open && (
        <div className="border-t border-zinc-800/20 bg-zinc-950/40 px-5 py-4">
          {/* Metadata */}
          <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-zinc-600">
            <span>v{project.templateVersion}</span>
            {project.projectPath && (
              <code className="font-mono text-zinc-500">{project.projectPath}</code>
            )}
            <span className="tabular-nums">
              {project.stepsCompleted} done
              {project.stepsFailed > 0 && <span className="text-red-400/70"> &middot; {project.stepsFailed} failed</span>}
              {project.stepsSkipped > 0 && <span className="text-yellow-500/70"> &middot; {project.stepsSkipped} skipped</span>}
            </span>
          </div>

          {/* Steps list */}
          {steps.length > 0 && (
            <ol className="space-y-1.5">
              {steps.map((step) => {
                const s = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.pending!;
                return (
                  <li key={step.name} className="flex items-center gap-2 text-[12px]">
                    <span className={`h-1 w-1 shrink-0 rounded-full ${s.dot}`} />
                    <span className="text-zinc-400">{step.label}</span>
                    {step.error && (
                      <span className="truncate text-red-400/60">&mdash; {step.error}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
