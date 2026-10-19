import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";

export function WorkspaceShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="min-h-screen bg-canvas text-ink flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
      <header><p className="text-sm font-semibold text-forest mb-2">Your kitchen workspace</p><h1 className="text-3xl font-black">{title}</h1><p className="text-ink-secondary mt-2">{description}</p></header>
      <nav aria-label="Kitchen workflows" className="flex gap-3 flex-wrap">
        <Link className="px-4 py-3 rounded-xl bg-white border border-line-light font-semibold" href="/menu">Menu management</Link>
        <Link className="px-4 py-3 rounded-xl bg-white border border-line-light font-semibold" href="/records">Daily activity</Link>
        <Link className="px-4 py-3 rounded-xl bg-white border border-line-light font-semibold" href="/dashboard">Cooking plan</Link>
      </nav>
      {children}
    </main>
  </div>;
}

