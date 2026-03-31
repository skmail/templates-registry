import { mkdirSync, writeFileSync } from "fs";
import type { Template, Step } from "./types";
import { getProjectPath, getProjectsDir, getTemplateAssetsPath } from "./paths";
import { replaceVariables } from "./string";
import { bash } from "./runners/bash";
import { replace } from "./runners/replace";
import { setEnv } from "./runners/set-env";
import { copy } from "./runners/copy";

export interface StepLog {
  name: string;
  label: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  output?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RunResult {
  projectName: string;
  templateId: string;
  templateName: string;
  status: "completed" | "failed";
  projectPath: string;
  steps: StepLog[];
  stepsCompleted: number;
  stepsFailed: number;
  stepsSkipped: number;
}

export interface RunOptions {
  dryRun?: boolean;
  envValues?: Record<string, string>;
}

export async function runTemplate(
  projectName: string,
  template: Template,
  variables: Record<string, string>,
  options: RunOptions = {},
): Promise<RunResult> {
  const { dryRun = false } = options;

  // Ensure projects directory exists
  mkdirSync(getProjectsDir(), { recursive: true });

  const hasDependencies = template.steps.some(
    (s) => s.dependsOn && s.dependsOn.length > 0,
  );

  let stepLogs: StepLog[];

  if (hasDependencies) {
    stepLogs = await executeStepsWithDependencies(
      template,
      projectName,
      variables,
      options,
    );
  } else {
    stepLogs = await executeStepsSequentially(
      template,
      projectName,
      variables,
      options,
    );
  }

  if (!dryRun) {
    try {
      const registryMeta = {
        template: template.id,
        templateVersion: template.version,
        createdAt: new Date().toISOString(),
        variables,
      };
      writeFileSync(
        getProjectPath(projectName, ".template-registry.json"),
        JSON.stringify(registryMeta, null, 2),
      );
    } catch {
      // project dir may not exist if all steps failed
    }
  }

  const stepsCompleted = stepLogs.filter((s) => s.status === "completed").length;
  const stepsFailed = stepLogs.filter((s) => s.status === "failed").length;
  const stepsSkipped = stepLogs.filter((s) => s.status === "skipped").length;

  return {
    projectName,
    templateId: template.id,
    templateName: template.name,
    status: stepsFailed > 0 ? "failed" : "completed",
    projectPath: getProjectPath(projectName),
    steps: stepLogs,
    stepsCompleted,
    stepsFailed,
    stepsSkipped,
  };
}

async function executeStepsSequentially(
  template: Template,
  projectName: string,
  variables: Record<string, string>,
  options: RunOptions,
): Promise<StepLog[]> {
  const logs: StepLog[] = [];

  for (const step of template.steps) {
    const log = await executeStepSafe(
      step,
      template,
      projectName,
      variables,
      options,
    );
    logs.push(log);
    if (log.status === "failed") break;
  }

  return logs;
}

async function executeStepsWithDependencies(
  template: Template,
  projectName: string,
  variables: Record<string, string>,
  options: RunOptions,
): Promise<StepLog[]> {
  const stepsByName = new Map<string, Step>();
  for (const step of template.steps) {
    stepsByName.set(step.name, step);
  }

  // Validate references
  for (const step of template.steps) {
    for (const dep of step.dependsOn) {
      if (!stepsByName.has(dep)) {
        throw new Error(
          `Step "${step.name}" depends on "${dep}", which does not exist.`,
        );
      }
    }
  }

  detectCircularDependencies(template.steps);

  const done = new Set<string>();
  const failed = new Set<string>();
  const remaining = new Set(template.steps.map((s) => s.name));
  const logs: StepLog[] = [];

  while (remaining.size > 0) {
    const ready = template.steps.filter(
      (s) =>
        remaining.has(s.name) &&
        s.dependsOn.every((dep) => done.has(dep)) &&
        !s.dependsOn.some((dep) => failed.has(dep)),
    );

    // Skip steps whose dependencies failed
    const blocked = template.steps.filter(
      (s) =>
        remaining.has(s.name) &&
        s.dependsOn.some((dep) => failed.has(dep)),
    );
    for (const step of blocked) {
      logs.push({
        name: step.name,
        label: step.label,
        type: step.type,
        status: "skipped",
        error: "Skipped due to failed dependency",
      });
      remaining.delete(step.name);
    }

    if (ready.length === 0 && remaining.size > 0) {
      // Deadlock or all remaining are blocked
      break;
    }

    const results = await Promise.all(
      ready.map(async (step) => {
        const log = await executeStepSafe(
          step,
          template,
          projectName,
          variables,
          options,
        );
        return { name: step.name, log };
      }),
    );

    for (const { name, log } of results) {
      logs.push(log);
      remaining.delete(name);
      if (log.status === "completed") {
        done.add(name);
      } else {
        failed.add(name);
      }
    }
  }

  return logs;
}

function detectCircularDependencies(steps: Step[]) {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const adj = new Map<string, string[]>();

  for (const step of steps) {
    adj.set(step.name, step.dependsOn);
  }

  function dfs(name: string) {
    if (inStack.has(name)) {
      throw new Error(`Circular dependency detected involving step "${name}".`);
    }
    if (visited.has(name)) return;
    visited.add(name);
    inStack.add(name);
    for (const dep of adj.get(name) ?? []) {
      dfs(dep);
    }
    inStack.delete(name);
  }

  for (const step of steps) {
    dfs(step.name);
  }
}

async function executeStepSafe(
  step: Step,
  template: Template,
  projectName: string,
  variables: Record<string, string>,
  options: RunOptions,
): Promise<StepLog> {
  const log: StepLog = {
    name: step.name,
    label: step.label,
    type: step.type,
    status: "running",
    startedAt: new Date().toISOString(),
  };

  try {
    if (options.dryRun) {
      log.output = getDryRunDescription(step, template, projectName, variables);
      log.status = "completed";
    } else {
      const output = await executeStep(
        step,
        template,
        projectName,
        variables,
        options,
      );
      log.output = output;
      log.status = "completed";
    }
  } catch (error) {
    log.status = "failed";
    log.error = error instanceof Error ? error.message : String(error);
  }

  log.completedAt = new Date().toISOString();
  return log;
}

async function executeStep(
  step: Step,
  template: Template,
  projectName: string,
  variables: Record<string, string>,
  options: RunOptions,
): Promise<string> {
  switch (step.type) {
    case "bash": {
      const result = await bash(step, variables);
      return result.output;
    }
    case "replace": {
      for (const file of step.files) {
        for (const [toFind, toReplace] of step.replace) {
          replace(
            toFind,
            toReplace,
            file,
            getProjectPath(projectName),
            variables,
          );
        }
      }
      return `Replaced in ${step.files.length} file(s)`;
    }
    case "set-env": {
      setEnv(step, projectName, variables, options.envValues ?? {});
      return `Set ${step.vars.length} env variable(s)`;
    }
    case "copy": {
      for (const [from, to] of step.files) {
        copy(
          getTemplateAssetsPath(template.id, from),
          getProjectPath(projectName, to),
        );
      }
      return `Copied ${step.files.length} file(s)`;
    }
    default: {
      const _exhaustive: never = step;
      throw new Error(`Unhandled step type: ${(_exhaustive as Step).type}`);
    }
  }
}

function getDryRunDescription(
  step: Step,
  template: Template,
  projectName: string,
  variables: Record<string, string>,
): string {
  switch (step.type) {
    case "bash":
      return `[DRY RUN] Would execute: ${replaceVariables(step.command, variables)}`;
    case "copy":
      return `[DRY RUN] Would copy ${step.files.length} file(s)`;
    case "replace":
      return `[DRY RUN] Would replace in ${step.files.length} file(s)`;
    case "set-env":
      return `[DRY RUN] Would set ${step.vars.length} env variable(s)`;
    default:
      return `[DRY RUN] Unknown step type`;
  }
}
