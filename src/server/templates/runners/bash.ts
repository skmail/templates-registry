import { spawn } from "child_process";
import { getProjectsDir } from "../paths";
import { replaceVariables } from "../string";
import type { BashStep } from "../types";

export async function bash(
  step: BashStep,
  variables: Record<string, string>,
): Promise<{ exitCode: number | null; output: string }> {
  const command = replaceVariables(step.command, variables);
  let output = "";

  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: getProjectsDir(),
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      output += data.toString();
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ exitCode: code, output });
      } else {
        reject(new Error(`Process exited with code ${code}\n${output}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}
