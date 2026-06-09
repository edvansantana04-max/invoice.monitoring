import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProspect } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  const prospects = await prisma.prospect.findMany({
    include: { followUps: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Prospect</h1>
        <p className="text-sm text-slate-600">
          Track status prospect dan follow up.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Tambah Prospect</h2>
        <form action={createProspect} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Client" name="clientName" placeholder="Contoh: Bank Sumsel Babel" />
          <Field label="Solution" name="solution" placeholder="Contoh: Interixa" />
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Prospect</label>
            <input
              name="prospect"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Contoh: Mobile banking"
            />
          </div>
          <Field label="Status" name="status" placeholder="Contoh: Follow up / POC / Win" />
          <div className="md:col-span-2">
            <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
              Simpan
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Solution</th>
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Follow up (open)</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((p) => {
              const open = p.followUps.filter((f) => f.status === "OPEN").length;
              return (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {p.clientName ?? "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.solution ?? "-"}</td>
                  <td className="px-4 py-3">{p.prospect ?? "-"}</td>
                  <td className="px-4 py-3">{p.status ?? "-"}</td>
                  <td className="px-4 py-3">{open}</td>
                </tr>
              );
            })}
            {prospects.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                  Belum ada data prospect.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );
}
