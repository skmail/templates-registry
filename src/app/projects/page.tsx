import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { redirect } from "next/navigation";
import { ProjectsList } from "./projects-list";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  void api.template.getProjects.prefetch();

  return (
    <HydrateClient>
      <section className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Projects
        </h1>
        <p className="mt-1.5 text-[15px] text-gray-500">
          History of projects scaffolded from templates.
        </p>
      </section>
      <ProjectsList />
    </HydrateClient>
  );
}
