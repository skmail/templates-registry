import { cpSync, mkdirSync } from "fs";
import path from "path";

export function copy(source: string, destination: string): void {
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
}
