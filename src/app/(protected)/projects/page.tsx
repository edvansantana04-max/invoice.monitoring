import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { client: true, billings: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Project & Termin</h1>
          <p className="text-sm text-slate-600">
            Input project, termin, status invoice & pembayaran.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          + Project
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">PO</th>
              <th className="px-4 py-3">Termin</th>
              <th className="px-4 py-3">Unpaid</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const unpaid = p.billings.filter((b) => b.invoiceStatus !== "PAID")
                .length;
              return (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{p.client.name}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {p.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.product ?? "-"}</td>
                  <td className="px-4 py-3">{p.poNumber ?? "-"}</td>
                  <td className="px-4 py-3">{p.billings.length}</td>
                  <td className="px-4 py-3">{unpaid}</td>
                </tr>
              );
            })}
            {projects.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  Belum ada project. Mulai dari Import Excel atau tambah manual.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
