import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addFollowUp, markFollowUpDone } from "../actions";

export const dynamic = "force-dynamic";

function dateValue(d: Date | null) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: { followUps: { orderBy: { createdAt: "desc" } } },
  });

  if (!prospect) {
    return (
      <div className="rounded-xl border bg-white p-6">
        Prospect tidak ditemukan.{" "}
        <Link href="/prospects" className="underline">
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-slate-600">{prospect.solution ?? "-"}</div>
          <h1 className="text-2xl font-semibold">{prospect.clientName ?? "-"}</h1>
          <div className="mt-1 text-sm text-slate-600">
            Prospect: {prospect.prospect ?? "-"} · Status:{" "}
            <span className="font-medium">{prospect.status ?? "-"}</span>
          </div>
        </div>
        <Link
          href="/prospects"
          className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
        >
          ← Semua prospect
        </Link>
      </div>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Tambah Follow Up</h2>
        <form
          action={addFollowUp.bind(null, prospect.id)}
          className="mt-4 grid gap-3 md:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Due date</label>
            <input
              name="dueDate"
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Catatan</label>
            <input
              name="note"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Contoh: follow up proposal minggu ini"
            />
          </div>
          <div className="md:col-span-3">
            <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
              Tambah
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Daftar Follow Up</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Catatan</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {prospect.followUps.map((f) => (
              <tr key={f.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">{f.status}</td>
                <td className="px-4 py-3">{dateValue(f.dueDate)}</td>
                <td className="px-4 py-3">{f.note}</td>
                <td className="px-4 py-3">
                  {f.status === "OPEN" ? (
                    <form action={markFollowUpDone.bind(null, f.id)}>
                      <input type="hidden" name="prospectId" value={prospect.id} />
                      <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50">
                        Mark done
                      </button>
                    </form>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>
              </tr>
            ))}
            {prospect.followUps.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                  Belum ada follow up.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
