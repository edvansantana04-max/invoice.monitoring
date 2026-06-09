import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createBilling, updateBilling } from "../actions";

export const dynamic = "force-dynamic";

function fmt(n: unknown) {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(v);
}

function dateValue(d: Date | null) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { client: true, billings: { orderBy: { month: "asc" } } },
  });

  if (!project) {
    return (
      <div className="rounded-xl border bg-white p-6">
        Project tidak ditemukan.{" "}
        <Link href="/projects" className="underline">
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-slate-600">{project.client.name}</div>
          <h1 className="text-2xl font-semibold">{project.projectName}</h1>
          <div className="mt-1 text-sm text-slate-600">
            Produk: {project.product ?? "-"} · PO: {project.poNumber ?? "-"}
          </div>
        </div>
        <Link
          href="/projects"
          className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
        >
          ← Semua project
        </Link>
      </div>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Tambah Termin/Tagihan</h2>
        <form
          action={createBilling.bind(null, project.id)}
          className="mt-4 grid gap-3 md:grid-cols-3"
        >
          <Field label="Bulan (plan)" name="month" type="date" />
          <Field label="Termin ratio" name="terminRatio" placeholder="0.5" />
          <Field label="Amount (before tax)" name="amount" placeholder="498750000" />
          <Field label="Tax rate" name="taxRate" placeholder="0.11" />
          <Field
            label="Amount after tax"
            name="amountAfterTax"
            placeholder="553612500"
          />
          <Field label="No Quotation" name="quotationNo" placeholder="Opsional" />
          <Field label="No PO (override)" name="poNumber" placeholder="Opsional" />
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={2}
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
          <h2 className="text-lg font-semibold">Daftar Termin/Tagihan</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Bulan</th>
              <th className="px-4 py-3">Termin</th>
              <th className="px-4 py-3">After Tax</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Update</th>
            </tr>
          </thead>
          <tbody>
            {project.billings.map((b) => (
              <tr key={b.id} className="border-b align-top last:border-b-0">
                <td className="px-4 py-3">
                  {b.month ? b.month.toISOString().slice(0, 10) : "-"}
                </td>
                <td className="px-4 py-3">{b.terminRatio ? String(b.terminRatio) : "-"}</td>
                <td className="px-4 py-3">
                  Rp {fmt(b.amountAfterTax ?? 0)}
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-slate-600">
                    Status: <span className="font-medium">{b.invoiceStatus}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Date: {b.invoiceDate ? b.invoiceDate.toISOString().slice(0, 10) : "-"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-slate-600">
                    Paid:{" "}
                    {b.paidAmount
                      ? `Rp ${fmt(b.paidAmount)}`
                      : b.amountAfterTax
                        ? `Rp ${fmt(b.amountAfterTax)} (default)`
                        : "-"}
                  </div>
                  <div className="text-xs text-slate-600">
                    Date: {b.paymentDate ? b.paymentDate.toISOString().slice(0, 10) : "-"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <form
                    action={updateBilling.bind(null, b.id)}
                    className="grid gap-2"
                  >
                    <input type="hidden" name="projectId" value={project.id} />
                    <select
                      name="invoiceStatus"
                      defaultValue={b.invoiceStatus}
                      className="rounded-md border px-2 py-1 text-sm"
                    >
                      <option value="PLANNED">PLANNED</option>
                      <option value="SENT">SENT</option>
                      <option value="PAID">PAID</option>
                    </select>
                    <input
                      name="invoiceDate"
                      type="date"
                      defaultValue={dateValue(b.invoiceDate)}
                      className="rounded-md border px-2 py-1 text-sm"
                    />
                    <input
                      name="paymentDate"
                      type="date"
                      defaultValue={dateValue(b.paymentDate)}
                      className="rounded-md border px-2 py-1 text-sm"
                    />
                    <input
                      name="paidAmount"
                      placeholder="paidAmount (opsional)"
                      defaultValue={b.paidAmount ? String(b.paidAmount) : ""}
                      className="rounded-md border px-2 py-1 text-sm"
                    />
                    <input
                      name="rawStatus"
                      placeholder="status bebas (opsional)"
                      defaultValue={b.rawStatus ?? ""}
                      className="rounded-md border px-2 py-1 text-sm"
                    />
                    <textarea
                      name="notes"
                      placeholder="notes"
                      defaultValue={b.notes ?? ""}
                      rows={2}
                      className="rounded-md border px-2 py-1 text-sm"
                    />
                    <button className="rounded-md bg-slate-900 px-2 py-1.5 text-sm font-medium text-white">
                      Simpan
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {project.billings.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  Belum ada termin/tagihan.
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
  type,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type ?? "text"}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );
}
