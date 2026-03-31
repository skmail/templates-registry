import { api, HydrateClient } from "~/trpc/server";
import { TemplateSetup } from "./template-setup";
import { notFound } from "next/navigation";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let template;
  try {
    template = await api.template.getById({ id });
  } catch {
    notFound();
  }

  void api.template.generateName.prefetch();

  return (
    <HydrateClient>
      <TemplateSetup template={template} />
    </HydrateClient>
  );
}
