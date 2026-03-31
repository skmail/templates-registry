import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { replaceVariables } from "../string";

export function replace(
  oldText: string,
  newText: string,
  fileName: string,
  workingDir: string,
  variables: Record<string, string>,
): void {
  const resolvedDir = path.resolve(workingDir);
  const resolvedFileName = replaceVariables(fileName, variables);
  const fullPath = path.join(resolvedDir, resolvedFileName);
  const resolvedNewText = replaceVariables(newText, variables);
  const content = readFileSync(fullPath, "utf-8");
  const updated = content.replaceAll(oldText, resolvedNewText);
  writeFileSync(fullPath, updated, "utf-8");
}
