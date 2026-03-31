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
      <div className="mx-auto max-w-5xl px-6 py-10">
        <section className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            My Projects
          </h1>
          <p className="mt-1 text-[14px] text-gray-500">
            Everything you've built so far.
          </p>
        </section>
        <ProjectsList />
      </div>
    </HydrateClient>
  );
}
