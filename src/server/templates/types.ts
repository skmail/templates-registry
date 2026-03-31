import { z } from "zod";

const BaseStepSchema = z.object({
  name: z.string(),
  label: z.string(),
  dependsOn: z.array(z.string()).optional().default([]),
});

export const BashStepSchema = BaseStepSchema.extend({
  type: z.literal("bash"),
  command: z.string(),
});

export const ReplaceStepSchema = BaseStepSchema.extend({
  type: z.literal("replace"),
  files: z.array(z.string()),
  replace: z.array(z.tuple([z.string(), z.string()])),
});

export const SetEnvStepSchema = BaseStepSchema.extend({
  type: z.literal("set-env"),
  vars: z.array(z.string()),
  quoted: z.boolean().optional(),
});

export const CopyStepSchema = BaseStepSchema.extend({
  type: z.literal("copy"),
  files: z.array(z.tuple([z.string(), z.string()])),
});

export const StepSchema = z.discriminatedUnion("type", [
  BashStepSchema,
  ReplaceStepSchema,
  SetEnvStepSchema,
  CopyStepSchema,
]);

export const TemplateVariableSchema = z.object({
  name: z.string(),
  message: z.string(),
  default: z.string().optional(),
  choices: z.array(z.string()).optional(),
});

export const TemplateSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string().optional().default("1.0.0"),
  variables: z.array(TemplateVariableSchema).optional().default([]),
  steps: z.array(StepSchema),
});

export type BashStep = z.infer<typeof BashStepSchema>;
export type ReplaceStep = z.infer<typeof ReplaceStepSchema>;
export type SetEnvStep = z.infer<typeof SetEnvStepSchema>;
export type CopyStep = z.infer<typeof CopyStepSchema>;
export type Step = z.infer<typeof StepSchema>;
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
export type Template = z.infer<typeof TemplateSchema> & { id: string };
