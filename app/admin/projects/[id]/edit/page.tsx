import { notFound } from "next/navigation";
import AdminProjectList from "@/components/AdminProjectList";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.NEXT_PUBLIC_STATIC_SNAPSHOT === "true") notFound();
  const { id } = await params;
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-7 sm:px-8 lg:px-10">
      <AdminProjectList editProjectId={id} />
    </main>
  );
}
