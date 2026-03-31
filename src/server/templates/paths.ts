import path from "path";

const TEMPLATE_EXTENSIONS = ["json", "jsonc"] as const;

export { TEMPLATE_EXTENSIONS };

export function getTemplatesDir(): string {
  return path.join(process.cwd(), "src/templates");
}

function getTemplatePath(
  templateName: string,
  ...parts: string[]
): string {
  const templatesDir = getTemplatesDir();
  const templatePath = path.join(templatesDir, templateName);
  const targetPath = path.join(templatePath, ...parts);
  if (!targetPath.startsWith(templatePath)) {
    throw new Error(`Template path "${targetPath}" is invalid.`);
  }
  return targetPath;
}

export function getTemplateFile(
  templateName: string,
  ext: (typeof TEMPLATE_EXTENSIONS)[number],
): string {
  return path.join(getTemplatesDir(), `${templateName}.${ext}`);
}

export function getTemplateAssetsPath(
  templateName: string,
  assetPath: string,
): string {
  return getTemplatePath(templateName, assetPath);
}

export function getProjectsDir(): string {
  return path.join(process.cwd(), "projects");
}

export function getProjectPath(projectName: string, extra?: string): string {
  const projectPath = path.join(getProjectsDir(), projectName);
  const targetPath = path.join(projectPath, extra ?? "");
  if (!targetPath.startsWith(projectPath)) {
    throw new Error(`Project path "${targetPath}" is invalid.`);
  }
  return targetPath;
}
