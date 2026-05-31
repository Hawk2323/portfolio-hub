import AdminProjectList from "@/components/AdminProjectList";

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-pine">Protected admin</p>
        <h1 className="text-4xl font-semibold text-ink">Portfolio projects</h1>
      </header>
      <AdminProjectList />
    </main>
  );
}
