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
  bash: "bg-blue-50 text-blue-600 ring-blue-200",
  copy: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  replace: "bg-amber-50 text-amber-600 ring-amber-200",
  "set-env": "bg-violet-50 text-violet-600 ring-violet-200",
};

const TYPE_LABELS: Record<string, string> = {
  bash: "Shell",
  copy: "Copy",
  replace: "Patch",
  "set-env": "Env",
};

interface PromptItem {
  key: string;
  label: string;
  defaultValue?: string;
  choices?: string[];
}

export function TemplateSetup({ template }: { template: TemplateData }) {
  const { data: generatedName } = api.template.generateName.useQuery();
  const executeMutation = api.template.execute.useMutation();

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

  const startExecution = useCallback(
    (allAnswers: Record<string, string>) => {
      const name = allAnswers.__projectName;
      if (!name || hasStartedRef.current) return;
      hasStartedRef.current = true;
      setPhase("executing");
      const { __projectName: _, ...templateVars } = allAnswers;
      executeMutation.mutate(
        {
          templateId: template.id,
          projectName: name,
          variables: templateVars,
          envValues: {},
        },
        { onSettled: () => setPhase("done") },
      );
    },
    [template.id, executeMutation],
  );

  const handleSubmitAnswer = (value: string) => {
    const prompt = prompts[currentIndex]!;
    const finalValue = value || prompt.defaultValue || "";
    if (!finalValue) return;

    const newAnswers = { ...answers, [prompt.key]: finalValue };
    setAnswers(newAnswers);

    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      startExecution(newAnswers);
    }
  };

  useEffect(() => {
    if (prompts.length === 0 && generatedName?.name && !hasStartedRef.current) {
      startExecution({ __projectName: generatedName.name });
    }
  }, [prompts.length, generatedName?.name, startExecution]);

  const currentPrompt = prompts[currentIndex];
  const result = executeMutation.data;
  const error = executeMutation.error;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[13px] text-gray-400">
        <Link href="/" className="transition-colors hover:text-gray-700">Templates</Link>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="font-medium text-gray-600">{template.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Setting up {template.name}
        </h1>
        <p className="mt-1 text-[14px] text-gray-500">
          Answer the prompts below and your project will be ready in seconds.
        </p>
      </header>

      {/* Terminal card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-xl shadow-gray-200/60">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex-1 text-center text-[12px] font-medium text-gray-500">
            {template.name} &middot; v{template.version}
          </span>
        </div>

        {/* Terminal content */}
        <div className="p-6 font-mono text-[13px] leading-8 text-gray-300">
          {/* Answered prompts */}
          {prompts.slice(0, currentIndex + (phase !== "prompting" ? 1 : 0)).map((p) => (
            <div key={p.key} className="flex items-baseline gap-2">
              <span className="text-emerald-400">&#10003;</span>
              <span className="text-gray-400">{p.label}:</span>
              <span className="font-semibold text-white">{answers[p.key]}</span>
            </div>
          ))}

          {/* Current prompt */}
          {phase === "prompting" && currentPrompt && (
            <div className="mt-1">
              {currentPrompt.key === "__projectName" && !generatedName ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <PulsingDot />
                  <span>Loading&hellip;</span>
                </div>
              ) : currentPrompt.choices ? (
                <ChoicePrompt prompt={currentPrompt} onSelect={handleSubmitAnswer} />
              ) : (
                <TextPrompt prompt={currentPrompt} onSubmit={handleSubmitAnswer} />
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

      {/* Sidebar info below on mobile, steps preview */}
      {phase === "prompting" && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-gray-400">
            What happens next
          </h2>
          <ol className="space-y-2">
            {template.steps.map((step, i) => (
              <li key={step.name} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white font-mono text-[10px] font-bold text-gray-400 ring-1 ring-gray-200">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-700">{step.label}</p>
                  <span className={`mt-0.5 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${TYPE_COLORS[step.type] ?? "bg-gray-50 text-gray-500 ring-gray-200"}`}>
                    {TYPE_LABELS[step.type] ?? step.type}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
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
    inputRef.current?.focus();
  }, [prompt.key]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <span className="text-brand-400">?</span>
        <span className="text-gray-200">{prompt.label}</span>
        {prompt.defaultValue && (
          <span className="text-gray-600">({prompt.defaultValue})</span>
        )}
      </div>
      <div className="mt-2 ml-5">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={prompt.defaultValue ?? "Type here\u2026"}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-[13px] text-white placeholder-gray-600 caret-brand-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
        />
        <p className="mt-1.5 text-[11px] text-gray-600">
          Press Enter to confirm
          {prompt.defaultValue && " &middot; leave empty for default"}
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
        <span className="text-brand-400">?</span>
        <span className="text-gray-200">{prompt.label}</span>
      </div>
      <div className="ml-5 mt-2 space-y-0.5">
        {choices.map((choice, i) => (
          <button
            key={choice}
            type="button"
            role="option"
            aria-selected={i === focused}
            onClick={() => onSelect(choice)}
            onMouseEnter={() => setFocused(i)}
            className={`block w-full rounded-lg px-3 py-1.5 text-left transition-colors ${
              i === focused
                ? "bg-brand-500/20 text-brand-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {i === focused ? ">" : "\u00A0"} {choice}
          </button>
        ))}
      </div>
      <p className="ml-5 mt-1.5 text-[11px] text-gray-600">
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
    <div className="mt-4 border-t border-gray-800 pt-4">
      {isRunning && !result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-300">
            <Spinner />
            <span>Running template&hellip;</span>
          </div>
          <div className="ml-1 space-y-1">
            {steps.map((step) => (
              <div key={step.name} className="flex items-center gap-2 text-gray-600">
                <PulsingDot />
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {resultSteps && (
        <div className="space-y-1">
          {resultSteps.map((step) => (
            <StepLine key={step.name} step={step} />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 text-red-400">Error: {error.message}</div>
      )}

      {result && (
        <div className="mt-6 border-t border-gray-800 pt-4">
          {result.status === "completed" ? (
            <p className="text-emerald-400">
              Done! Project <span className="font-semibold text-white">{result.projectName}</span> created
              successfully. {result.stepsCompleted} step
              {result.stepsCompleted !== 1 ? "s" : ""} completed.
            </p>
          ) : (
            <p className="text-red-400">
              Failed. {result.stepsCompleted} completed, {result.stepsFailed} failed
              {result.stepsSkipped > 0 && `, ${result.stepsSkipped} skipped`}.
            </p>
          )}

          <div className="mt-5 flex gap-3 font-sans">
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-[13px] font-semibold text-white transition-all hover:bg-brand-600 active:scale-[0.97]"
            >
              Create Another
            </Link>
            <Link
              href="/projects"
              className="inline-flex h-9 items-center rounded-lg border border-gray-700 px-4 text-[13px] font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
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
    skipped: <span className="text-yellow-400">&#8722;</span>,
    running: <Spinner />,
    pending: <span className="text-gray-600">&#183;</span>,
  };

  const textColor: Record<string, string> = {
    completed: "text-gray-300",
    failed: "text-red-400",
    skipped: "text-yellow-400/70",
    running: "text-gray-200",
    pending: "text-gray-600",
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="w-4 text-center">{icon[step.status] ?? icon.pending}</span>
        {hasContent ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className={`flex flex-1 items-center gap-2 text-left ${textColor[step.status] ?? "text-gray-500"} hover:text-gray-200`}
          >
            <span className="flex-1">{step.label}</span>
            <svg
              className={`h-3 w-3 text-gray-600 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        ) : (
          <span className={`flex-1 ${textColor[step.status] ?? "text-gray-500"}`}>
            {step.label}
          </span>
        )}
      </div>
      {open && hasContent && (
        <pre className="ml-6 mt-1 max-h-36 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-gray-500">
          {step.error ?? step.output}
        </pre>
      )}
    </div>
  );
}

/* ─── Shared ─────────────────────────────────────────────────────── */

function PulsingDot() {
  return <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gray-500" />;
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin text-brand-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
