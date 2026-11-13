import Link from "next/link";
import { notFound } from "next/navigation";
import AdminProjectList from "@/components/AdminProjectList";

export default function AdminPage() {
  if (process.env.NEXT_PUBLIC_STATIC_SNAPSHOT === "true") notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-pine">Administrace</p>
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Portfolio Hub</h1>
        </div>
        <Link className="admin-button-secondary" href="/">Zpět na portfolio</Link>
      </header>
      <AdminProjectList />
    </main>
  );
}
