import { existsSync } from "fs";
import path from "path";
import { getProjectsDir } from "./paths";

const adjectives = [
  "robust", "scalable", "modular", "atomic", "fluid",
  "kinetic", "unified", "stellar",
];
const prefixes = [
  "nexus", "apex", "prime", "delta", "flux",
  "zenith", "core", "iron",
];
const nouns = [
  "stack", "engine", "layer", "vortex", "gateway",
  "cipher", "anchor", "orbit",
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]!;

export function generateUniqueProjectName(): string {
  const basePath = getProjectsDir();
  for (let i = 0; i < 100; i++) {
    const candidate = `${pick(adjectives)}-${pick(prefixes)}-${pick(nouns)}`;
    if (!existsSync(path.join(basePath, candidate))) {
      return candidate;
    }
  }
  return `project-${Date.now()}`;
}
