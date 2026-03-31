import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  getTemplates,
  getTemplate,
  generateUniqueProjectName,
} from "~/server/templates";
import { runTemplate } from "~/server/templates/runner";

export const templateRouter = createTRPCRouter({
  list: publicProcedure.query(() => {
    return getTemplates().map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      version: t.version,
      variables: t.variables,
      stepCount: t.steps.length,
      steps: t.steps.map((s) => ({
        name: s.name,
        label: s.label,
        type: s.type,
      })),
    }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const t = getTemplate(input.id);
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        version: t.version,
        variables: t.variables,
        steps: t.steps.map((s) => ({
          name: s.name,
          label: s.label,
          type: s.type,
          dependsOn: s.dependsOn,
        })),
      };
    }),

  generateName: publicProcedure.query(() => {
    return { name: generateUniqueProjectName() };
  }),

  execute: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        projectName: z.string().min(1),
        variables: z.record(z.string()),
        envValues: z.record(z.string()).optional(),
        dryRun: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const template = getTemplate(input.templateId);
      const variables = { project: input.projectName, ...input.variables };

      // Create project record
      const project = await ctx.db.project.create({
        data: {
          name: input.projectName,
          templateId: template.id,
          templateName: template.name,
          templateVersion: template.version,
          status: "running",
          variables,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });

      try {
        const result = await runTemplate(
          input.projectName,
          template,
          variables,
          {
            dryRun: input.dryRun,
            envValues: input.envValues,
          },
        );

        // Update project with results
        await ctx.db.project.update({
          where: { id: project.id },
          data: {
            status: result.status,
            projectPath: result.projectPath,
            steps: JSON.parse(JSON.stringify(result.steps)),
            stepsCompleted: result.stepsCompleted,
            stepsFailed: result.stepsFailed,
            stepsSkipped: result.stepsSkipped,
          },
        });

        return { projectId: project.id, ...result };
      } catch (error) {
        await ctx.db.project.update({
          where: { id: project.id },
          data: {
            status: "failed",
            steps: JSON.parse(
              JSON.stringify([
                {
                  name: "error",
                  label: "Execution Error",
                  type: "error",
                  status: "failed",
                  error:
                    error instanceof Error ? error.message : String(error),
                },
              ]),
            ),
          },
        });
        throw error;
      }
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: { createdById: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  getProject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findFirst({
        where: { id: input.id, createdById: ctx.session.user.id },
      });
    }),
});
