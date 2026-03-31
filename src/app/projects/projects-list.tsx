"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  completed: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: "Completed" },
  failed: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", label: "Failed" },
  running: { dot: "bg-blue-500 animate-pulse", bg: "bg-blue-50", text: "text-blue-700", label: "Running" },
  pending: { dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600", label: "Pending" },
};

export function ProjectsList() {
  const { data: projects, isLoading } = api.template.getProjects.useQuery();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-[14px] text-gray-400">
        Loading&hellip;
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <svg className="h-6 w-6 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-gray-700">No projects yet</p>
        <p className="mt-1 text-[13px] text-gray-400">
          Create your first project from a template.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand-500 px-5 text-[13px] font-semibold text-white shadow-sm shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-[0.97]"
        >
          Browse Templates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
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

function ProjectCard({ project }: { project: ProjectData }) {
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="truncate font-mono text-[14px] font-bold text-gray-900">
              {project.name}
            </h3>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.bg} ${status.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[12px] text-gray-400">
            <span className="font-medium text-gray-500">{project.templateName}</span>
            <span>{date}</span>
            <span className="tabular-nums">
              {project.stepsCompleted}/{project.stepsCompleted + project.stepsFailed + project.stepsSkipped} steps
            </span>
          </div>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          {project.projectPath && (
            <p className="mb-3 text-[12px] text-gray-400">
              Path: <code className="font-mono text-gray-600">{project.projectPath}</code>
            </p>
          )}
          {steps.length > 0 && (
            <ol className="space-y-1.5">
              {steps.map((step) => {
                const s = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.pending!;
                return (
                  <li key={step.name} className="flex items-center gap-2 text-[12px]">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                    <span className="text-gray-600">{step.label}</span>
                    {step.error && (
                      <span className="truncate text-red-500">&mdash; {step.error}</span>
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
