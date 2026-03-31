import { existsSync, readFileSync, writeFileSync } from "fs";
import { getProjectPath } from "../paths";
import { replaceVariables } from "../string";
import type { SetEnvStep } from "../types";

export function setEnv(
  step: SetEnvStep,
  projectName: string,
  variables: Record<string, string>,
  envValues: Record<string, string>,
): void {
  const envPath = getProjectPath(projectName, ".env");

  for (const variable of step.vars) {
    const resolvedVar = replaceVariables(variable, variables);
    const value = envValues[resolvedVar] ?? "";
    const resolvedValue = replaceVariables(value, variables);
    setEnvValue(
      resolvedVar,
      step.quoted ? `"${resolvedValue}"` : resolvedValue,
      envPath,
    );
  }
}

function setEnvValue(
  key: string,
  value: string | number,
  envPath: string,
): void {
  let envContent = "";

  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, "utf8");
  }

  const regex = new RegExp(`^${key}=.*`, "m");
  const entry = `${key}=${value}`;

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, entry);
  } else {
    const padding = envContent.endsWith("\n") || envContent === "" ? "" : "\n";
    envContent += `${padding}${entry}\n`;
  }

  writeFileSync(envPath, envContent);
}
