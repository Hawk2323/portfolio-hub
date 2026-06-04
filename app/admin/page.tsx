import Link from "next/link";
import { notFound } from "next/navigation";
import AdminProjectList from "@/components/AdminProjectList";

export default function AdminPage() {
  if (process.env.NEXT_PUBLIC_STATIC_SNAPSHOT === "true") {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-pine">Protected admin</p>
          <h1 className="text-4xl font-semibold text-ink">Portfolio projects</h1>
        </div>
        <Link className="admin-button-secondary" href="/">
          Back to hub
        </Link>
      </header>
      <AdminProjectList />
    </main>
  );
}
