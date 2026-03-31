"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

interface TemplateVariable {
  name: string;
  message: string;
  default?: string;
  choices?: string[];
}

interface TemplateStep {
  name: string;
  label: string;
  type: string;
  dependsOn: string[];
}

interface TemplateData {
  id: string;
  name: string;
  description: string;
  version: string;
  variables: TemplateVariable[];
  steps: TemplateStep[];
}

interface StepLog {
  name: string;
  label: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  output?: string;
  error?: string;
}

const TYPE_COLORS: Record<string, string> = {
  bash: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  copy: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  replace: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  "set-env": "bg-violet-500/10 text-violet-400 ring-violet-500/20",
};

const TYPE_LABELS: Record<string, string> = {
  bash: "Shell",
  copy: "Copy",
  replace: "Patch",
  "set-env": "Env",
};

// All prompts: project name first, then template variables
interface PromptItem {
  key: string;
  label: string;
  defaultValue?: string;
  choices?: string[];
}

export function TemplateSetup({ template }: { template: TemplateData }) {
  const { data: generatedName } = api.template.generateName.useQuery();
  const executeMutation = api.template.execute.useMutation();

  // Build the full prompt sequence: project name + template variables
  const prompts: PromptItem[] = [
    {
      key: "__projectName",
      label: "Project name",
      defaultValue: generatedName?.name,
    },
    ...template.variables.map((v) => ({
      key: v.name,
      label: v.message,
      defaultValue: v.default,
      choices: v.choices,
    })),
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"prompting" | "executing" | "done">("prompting");
  const hasStartedRef = useRef(false);

  const projectName = answers.__projectName ?? "";

  const startExecution = useCallback(
    (allAnswers: Record<string, string>) => {
      const name = allAnswers.__projectName;
      if (!name || hasStartedRef.current) return;
      hasStartedRef.current = true;
      setPhase("executing");

      // Strip out __projectName from the variables sent to the runner
      const { __projectName: _, ...templateVars } = allAnswers;

      executeMutation.mutate(
        {
          templateId: template.id,
          projectName: name,
          variables: templateVars,
          envValues: {},
        },
        {
          onSettled: () => setPhase("done"),
        },
      );
    },
    [template.id, executeMutation],
  );

  const handleSubmitAnswer = (value: string) => {
    const prompt = prompts[currentIndex]!;
    const finalValue = value || prompt.defaultValue || "";
    if (!finalValue) return; // don't accept empty for required fields

    const newAnswers = { ...answers, [prompt.key]: finalValue };
    setAnswers(newAnswers);

    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All prompts answered
      startExecution(newAnswers);
    }
  };

  const currentPrompt = prompts[currentIndex];
  const result = executeMutation.data;
  const error = executeMutation.error;

  // If there are no prompts at all (shouldn't happen since project name is always there)
  // but just in case, auto-execute
  useEffect(() => {
    if (prompts.length === 0 && generatedName?.name && !hasStartedRef.current) {
      startExecution({ __projectName: generatedName.name });
    }
  }, [prompts.length, generatedName?.name, startExecution]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-2 text-[13px] text-zinc-600"
      >
        <Link href="/" className="transition-colors hover:text-zinc-300">
          Templates
        </Link>
        <ChevronRight />
        <span className="text-zinc-400">{template.name}</span>
      </nav>

      {/* Terminal container */}
      <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-[#0c0c0e]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-zinc-800/40 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="ml-2 flex-1 text-center text-[11px] text-zinc-600">
            {template.name} &middot; v{template.version}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 font-mono text-[13px] leading-7">
          {/* Already answered prompts */}
          {prompts.slice(0, currentIndex + (phase !== "prompting" ? 1 : 0)).map((p) => (
            <LogLine key={p.key} label={p.label} value={answers[p.key] ?? ""} />
          ))}

          {/* Current prompt */}
          {phase === "prompting" && currentPrompt && (
            <div className="mt-1">
              {/* Wait for generated name to load before showing project name prompt */}
              {currentPrompt.key === "__projectName" && !generatedName ? (
                <div className="flex items-center gap-2 text-zinc-600">
                  <PulsingDot />
                  <span>Loading&hellip;</span>
                </div>
              ) : currentPrompt.choices ? (
                <ChoicePrompt
                  prompt={currentPrompt}
                  onSelect={handleSubmitAnswer}
                />
              ) : (
                <TextPrompt
                  prompt={currentPrompt}
                  onSubmit={handleSubmitAnswer}
                />
              )}
            </div>
          )}

          {/* Execution */}
          {(phase === "executing" || phase === "done") && (
            <ExecutionView
              steps={template.steps}
              result={result}
              error={error}
              isRunning={executeMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Text prompt ────────────────────────────────────────────────── */

function TextPrompt({
  prompt,
  onSubmit,
}: {
  prompt: PromptItem;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when this prompt appears
    inputRef.current?.focus();
  }, [prompt.key]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <span className="text-emerald-400">?</span>
        <span className="text-zinc-300">{prompt.label}</span>
        {prompt.defaultValue && (
          <span className="text-zinc-700">({prompt.defaultValue})</span>
        )}
      </div>
      <div className="mt-2 ml-5">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={prompt.defaultValue ?? "Type your answer\u2026"}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-600 caret-emerald-400 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
        <p className="mt-1.5 text-[11px] text-zinc-700">
          Press Enter to confirm
          {prompt.defaultValue && " (leave empty for default)"}
        </p>
      </div>
    </form>
  );
}

/* ─── Choice prompt ──────────────────────────────────────────────── */

function ChoicePrompt({
  prompt,
  onSelect,
}: {
  prompt: PromptItem;
  onSelect: (v: string) => void;
}) {
  const [focused, setFocused] = useState(0);
  const choices = prompt.choices ?? [];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, [prompt.key]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((f) => (f + 1) % choices.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => (f - 1 + choices.length) % choices.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(choices[focused]!);
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="focus:outline-none"
      role="listbox"
      aria-label={prompt.label}
    >
      <div className="flex items-center gap-2">
        <span className="text-emerald-400">?</span>
        <span className="text-zinc-300">{prompt.label}</span>
      </div>
      <div className="ml-5 mt-1 space-y-0.5">
        {choices.map((choice, i) => (
          <button
            key={choice}
            type="button"
            role="option"
            aria-selected={i === focused}
            onClick={() => onSelect(choice)}
            onMouseEnter={() => setFocused(i)}
            className={`block w-full rounded px-2 py-0.5 text-left transition-colors ${
              i === focused
                ? "bg-zinc-800 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {i === focused ? ">" : "\u00A0"} {choice}
          </button>
        ))}
      </div>
      <p className="ml-5 mt-1 text-[11px] text-zinc-700">
        Arrow keys to move, Enter to select
      </p>
    </div>
  );
}

/* ─── Execution view ─────────────────────────────────────────────── */

function ExecutionView({
  steps,
  result,
  error,
  isRunning,
}: {
  steps: TemplateStep[];
  result:
    | {
        projectName: string;
        templateName: string;
        status: string;
        projectPath: string;
        steps: StepLog[];
        stepsCompleted: number;
        stepsFailed: number;
        stepsSkipped: number;
      }
    | undefined;
  error: { message: string } | null;
  isRunning: boolean;
}) {
  const resultSteps = result?.steps;

  return (
    <div className="mt-4 border-t border-zinc-800/30 pt-4">
      {/* Running state - show pending steps */}
      {isRunning && !result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Spinner />
            <span>Running template&hellip;</span>
          </div>
          <div className="ml-1 space-y-1">
            {steps.map((step) => (
              <div
                key={step.name}
                className="flex items-center gap-2 text-zinc-600"
              >
                <PulsingDot />
                <span>{step.label}</span>
                <TypeBadge type={step.type} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed/failed steps */}
      {resultSteps && (
        <div className="space-y-1">
          {resultSteps.map((step) => (
            <StepLine key={step.name} step={step} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 text-red-400">Error: {error.message}</div>
      )}

      {/* Done summary */}
      {result && (
        <div className="mt-6 border-t border-zinc-800/30 pt-4">
          {result.status === "completed" ? (
            <>
              <p className="text-emerald-400">
                Done! Project <span className="text-white">{result.projectName}</span> created
                successfully. {result.stepsCompleted} step
                {result.stepsCompleted !== 1 ? "s" : ""} completed.
              </p>
              <p className="mt-1 text-zinc-600">
                Location: {result.projectPath}
              </p>
            </>
          ) : (
            <p className="text-red-400">
              Failed. {result.stepsCompleted} completed, {result.stepsFailed}{" "}
              failed
              {result.stepsSkipped > 0 &&
                `, ${result.stepsSkipped} skipped`}
              .
            </p>
          )}

          <div className="mt-6 flex gap-3 font-sans">
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-[13px] font-medium text-zinc-900 transition-all hover:bg-zinc-200 active:scale-[0.98]"
            >
              Create Another
            </Link>
            <Link
              href="/projects"
              className="inline-flex h-9 items-center rounded-lg border border-zinc-800 px-4 text-[13px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              View Projects
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step line ──────────────────────────────────────────────────── */

function StepLine({ step }: { step: StepLog }) {
  const [open, setOpen] = useState(false);
  const hasContent = !!(step.output || step.error);

  const icon: Record<string, React.ReactNode> = {
    completed: <span className="text-emerald-400">&#10003;</span>,
    failed: <span className="text-red-400">&#10007;</span>,
    skipped: <span className="text-yellow-500">&#8722;</span>,
    running: <Spinner />,
    pending: <span className="text-zinc-600">&#183;</span>,
  };

  const textColor: Record<string, string> = {
    completed: "text-zinc-400",
    failed: "text-red-400",
    skipped: "text-yellow-500/70",
    running: "text-zinc-300",
    pending: "text-zinc-600",
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="w-4 text-center">
          {icon[step.status] ?? icon.pending}
        </span>
        {hasContent ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className={`flex flex-1 items-center gap-2 text-left ${textColor[step.status] ?? "text-zinc-500"} hover:text-zinc-300`}
          >
            <span className="flex-1">{step.label}</span>
            <TypeBadge type={step.type} />
            <svg
              className={`h-3 w-3 text-zinc-700 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        ) : (
          <div
            className={`flex flex-1 items-center gap-2 ${textColor[step.status] ?? "text-zinc-500"}`}
          >
            <span className="flex-1">{step.label}</span>
            <TypeBadge type={step.type} />
          </div>
        )}
      </div>
      {open && hasContent && (
        <pre className="ml-6 mt-1 max-h-36 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-600">
          {step.error ?? step.output}
        </pre>
      )}
    </div>
  );
}

/* ─── Shared ─────────────────────────────────────────────────────── */

function LogLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-emerald-400">&#10003;</span>
      <span className="text-zinc-400">{label}:</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${TYPE_COLORS[type] ?? "bg-zinc-800 text-zinc-500 ring-zinc-700"}`}
    >
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function PulsingDot() {
  return (
    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
  );
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin text-zinc-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}
