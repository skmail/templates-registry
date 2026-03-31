import { readdirSync, readFileSync } from "fs";
import { ZodError } from "zod";
import {
  getTemplatesDir,
  getTemplateFile,
  TEMPLATE_EXTENSIONS,
} from "./paths";
import { TemplateSchema, type Template } from "./types";
import { stripJsoncComments } from "./string";
import path from "path";

export function getTemplates(): Template[] {
  const dir = getTemplatesDir();
  return readdirSync(dir).reduce<Template[]>((acc, file) => {
    const ext = path.extname(file);
    if (!TEMPLATE_EXTENSIONS.some((e) => file.endsWith(`.${e}`))) {
      return acc;
    }
    const templateName = path.parse(file).name;
    try {
      acc.push(getTemplate(templateName));
    } catch {
      // skip invalid templates
    }
    return acc;
  }, []);
}

export function getTemplate(templateName: string): Template {
  const raw = readRawTemplate(templateName);
  try {
    return {
      id: templateName,
      ...TemplateSchema.parse(raw),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(
        `Template [${templateName}] validation failed:\n${issues}`,
      );
    }
    throw error;
  }
}

function readRawTemplate(templateName: string): unknown {
  for (const ext of TEMPLATE_EXTENSIONS) {
    try {
      return JSON.parse(
        stripJsoncComments(
          readFileSync(getTemplateFile(templateName, ext), "utf-8"),
        ),
      );
    } catch {
      // try next extension
    }
  }
  throw new Error(`Template [${templateName}] not found`);
}
