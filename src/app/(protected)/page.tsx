import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function fmt(n: unknown) {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(v);
}

export default async function DashboardPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [projectCount, billingCount, unpaidCount, plannedMonth, paidMonth] =
    await Promise.all([
      prisma.project.count(),
      prisma.billing.count(),
      prisma.billing.count({ where: { invoiceStatus: { not: "PAID" } } }),
      prisma.billing.aggregate({
        _sum: { amountAfterTax: true },
        where: { month: { gte: monthStart, lt: nextMonthStart } },
      }),
      prisma.billing.aggregate({
        _sum: { paidAmount: true, amountAfterTax: true },
        where: { paymentDate: { gte: monthStart, lt: nextMonthStart } },
      }),
    ]);

  const plannedIn = Number(plannedMonth._sum.amountAfterTax ?? 0);
  const paidIn = Number(paidMonth._sum.paidAmount ?? paidMonth._sum.amountAfterTax ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Ringkasan termin, penagihan, dan cashflow.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Project" value={fmt(projectCount)} />
        <Card title="Total Termin/Tagihan" value={fmt(billingCount)} />
        <Card title="Belum Paid" value={fmt(unpaidCount)} />
        <Card title="Inflow Bulan Ini (Plan)" value={`Rp ${fmt(plannedIn)}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm font-medium">Inflow Bulan Ini (Paid)</div>
          <div className="mt-2 text-2xl font-semibold">Rp {fmt(paidIn)}</div>
          <div className="mt-3 text-sm text-slate-600">
            Berdasarkan <span className="font-medium">paymentDate</span>.
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm font-medium">Quick Actions</div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link className="rounded-md border px-3 py-1.5 hover:bg-slate-50" href="/import">
              Import Excel
            </Link>
            <Link className="rounded-md border px-3 py-1.5 hover:bg-slate-50" href="/projects">
              Lihat Project
            </Link>
            <Link className="rounded-md border px-3 py-1.5 hover:bg-slate-50" href="/cashflow">
              Cashflow
            </Link>
            <Link className="rounded-md border px-3 py-1.5 hover:bg-slate-50" href="/prospects">
              Prospect
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="text-sm font-medium text-slate-700">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
