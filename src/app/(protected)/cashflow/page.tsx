import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

export default async function CashflowPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year ?? now.getFullYear());
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const [billings, payments, expenses] = await Promise.all([
    prisma.billing.findMany({
      where: { month: { gte: start, lt: end } },
      select: { month: true, amountAfterTax: true },
    }),
    prisma.billing.findMany({
      where: { paymentDate: { gte: start, lt: end } },
      select: { paymentDate: true, paidAmount: true, amountAfterTax: true },
    }),
    prisma.expenseValue.findMany({
      where: { month: { gte: start, lt: end } },
      select: { month: true, amount: true },
    }),
  ]);

  const plannedIn: Record<string, number> = {};
  for (const b of billings) {
    if (!b.month) continue;
    const k = monthKey(b.month);
    plannedIn[k] = (plannedIn[k] ?? 0) + Number(b.amountAfterTax ?? 0);
  }

  const paidIn: Record<string, number> = {};
  for (const p of payments) {
    if (!p.paymentDate) continue;
    const k = monthKey(p.paymentDate);
    const v = Number(p.paidAmount ?? p.amountAfterTax ?? 0);
    paidIn[k] = (paidIn[k] ?? 0) + v;
  }

  const out: Record<string, number> = {};
  for (const e of expenses) {
    const k = monthKey(e.month);
    out[k] = (out[k] ?? 0) + Number(e.amount ?? 0);
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    const k = monthKey(d);
    return { k, label: d.toLocaleString("id-ID", { month: "short" }) };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cashflow</h1>
          <p className="text-sm text-slate-600">
            Inflow (plan vs paid) dan outflow (cost) per bulan.
          </p>
        </div>
        <form className="flex items-center gap-2">
          <input
            name="year"
            defaultValue={String(year)}
            className="w-24 rounded-md border bg-white px-3 py-2 text-sm"
          />
          <button className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50">
            Filter
          </button>
          <Link
            href="/import"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Import Excel
          </Link>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Bulan</th>
              <th className="px-4 py-3">Inflow (Plan)</th>
              <th className="px-4 py-3">Inflow (Paid)</th>
              <th className="px-4 py-3">Outflow (Cost)</th>
              <th className="px-4 py-3">Net (Paid - Cost)</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => {
              const a = plannedIn[m.k] ?? 0;
              const b = paidIn[m.k] ?? 0;
              const c = out[m.k] ?? 0;
              const net = b - c;
              return (
                <tr key={m.k} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{m.label}</td>
                  <td className="px-4 py-3">Rp {fmt(a)}</td>
                  <td className="px-4 py-3">Rp {fmt(b)}</td>
                  <td className="px-4 py-3">Rp {fmt(c)}</td>
                  <td className="px-4 py-3">Rp {fmt(net)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
