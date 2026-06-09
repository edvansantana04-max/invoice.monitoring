"use server";

import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

function asString(v: unknown) {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  // exceljs may return { text: "..." }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyV = v as any;
  if (anyV?.text) return String(anyV.text).trim();
  return String(v).trim();
}

function asNumber(v: unknown) {
  const s = asString(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function asDate(v: unknown) {
  if (v instanceof Date) return v;
  const s = asString(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function findHeaderRow(sheet: ExcelJS.Worksheet, mustHave: string[]) {
  for (let r = 1; r <= Math.min(sheet.rowCount, 50); r++) {
    const row = sheet.getRow(r);
    const rowValues = (row.values as unknown as unknown[] | undefined) ?? [];
    const values = rowValues
      .slice(1)
      .map((v) => asString(v).toLowerCase());
    const ok = mustHave.every((h) => values.includes(h.toLowerCase()));
    if (ok) return r;
  }
  return null;
}

function findColIndexes(row: ExcelJS.Row, label: string) {
  const res: number[] = [];
  for (let c = 1; c <= row.cellCount; c++) {
    if (asString(row.getCell(c).value).toLowerCase() === label.toLowerCase())
      res.push(c);
  }
  return res;
}

export async function importExcel(formData: FormData) {
  const f = formData.get("file");
  if (!(f instanceof File)) throw new Error("File tidak valid.");

  const buf = Buffer.from(await f.arrayBuffer()) as unknown as Buffer;
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(buf as any);

  await prisma.$transaction(async (tx) => {
    await importProjectSheet(wb, tx);
    await importProspectSheet(wb, tx);
    await importCostSheet(wb, tx);
    await importRemainingInvoiceSheet(wb, tx);
    await importDsis2024Sheet(wb, tx);
  });

  redirect("/?imported=1");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = any;

async function upsertClient(tx: Tx, name: string) {
  return tx.client.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

async function findOrCreateProject(
  tx: Tx,
  clientId: string,
  projectName: string,
  product?: string | null,
  poNumber?: string | null,
  amountTotal?: number | null
) {
  const existing = await tx.project.findFirst({
    where: {
      clientId,
      projectName,
      poNumber: poNumber ?? undefined,
    },
  });
  if (existing) return existing;
  return tx.project.create({
    data: {
      clientId,
      projectName,
      product: product || null,
      poNumber: poNumber || null,
      amountTotal: amountTotal != null ? new Prisma.Decimal(amountTotal) : null,
    },
  });
}

async function importProjectSheet(wb: ExcelJS.Workbook, tx: Tx) {
  const sheet = wb.getWorksheet("Project");
  if (!sheet) return;

  const headerRowIdx = findHeaderRow(sheet, ["Client", "Project", "Termin"]);
  if (!headerRowIdx) return;

  const headerRow = sheet.getRow(headerRowIdx);
  const cClient = findColIndexes(headerRow, "Client")[0];
  const cProduct = findColIndexes(headerRow, "Product")[0];
  const cProject = findColIndexes(headerRow, "Project")[0];
  const cAmountTotal = findColIndexes(headerRow, "Amount Total")[0];
  const cTermin = findColIndexes(headerRow, "Termin")[0];
  const cMonth = findColIndexes(headerRow, "Month")[0];
  const cStatus = findColIndexes(headerRow, "Status")[0];
  const cNotes = findColIndexes(headerRow, "Notes")[0];
  const cPoNo = findColIndexes(headerRow, "NO PO")[0] ?? findColIndexes(headerRow, "PO")[0];

  const amountIncTaxCols = findColIndexes(headerRow, "Amount (inc Tax)");
  const amountCols = findColIndexes(headerRow, "Amount");
  const cAmountIncTax = amountIncTaxCols.at(-1);
  const cAmount = amountCols.at(-1);

  for (let r = headerRowIdx + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const clientName = asString(row.getCell(cClient).value);
    const projectName = asString(row.getCell(cProject).value);
    if (!clientName && !projectName) continue;
    if (!clientName || !projectName) continue;

    const product = cProduct ? asString(row.getCell(cProduct).value) : "";
    const poNumber = cPoNo ? asString(row.getCell(cPoNo).value) : "";
    const amountTotal = cAmountTotal ? asNumber(row.getCell(cAmountTotal).value) : null;

    const terminRatio = cTermin ? asNumber(row.getCell(cTermin).value) : null;
    const month = cMonth ? asDate(row.getCell(cMonth).value) : null;
    const rawStatus = cStatus ? asString(row.getCell(cStatus).value) : "";
    const notes = cNotes ? asString(row.getCell(cNotes).value) : "";

    const amount = cAmount ? asNumber(row.getCell(cAmount).value) : null;
    const amountAfterTax = cAmountIncTax
      ? asNumber(row.getCell(cAmountIncTax).value)
      : null;

    const client = await upsertClient(tx, clientName);
    const project = await findOrCreateProject(
      tx,
      client.id,
      projectName,
      product || null,
      poNumber || null,
      amountTotal
    );

    const invoiceStatus =
      rawStatus.toLowerCase() === "done" ? "PAID" : ("PLANNED" as const);

    const exists = await tx.billing.findFirst({
      where: {
        projectId: project.id,
        month: month ?? undefined,
        terminRatio:
          terminRatio != null ? new Prisma.Decimal(terminRatio) : undefined,
        amountAfterTax:
          amountAfterTax != null ? new Prisma.Decimal(amountAfterTax) : undefined,
      },
    });
    if (exists) continue;

    await tx.billing.create({
      data: {
        projectId: project.id,
        poNumber: poNumber || null,
        month,
        terminRatio: terminRatio != null ? new Prisma.Decimal(terminRatio) : null,
        amount: amount != null ? new Prisma.Decimal(amount) : null,
        amountAfterTax:
          amountAfterTax != null ? new Prisma.Decimal(amountAfterTax) : null,
        rawStatus: rawStatus || null,
        invoiceStatus,
        notes: notes || null,
        paymentDate: invoiceStatus === "PAID" ? month : null,
      },
    });
  }
}

async function importProspectSheet(wb: ExcelJS.Workbook, tx: Tx) {
  const sheet = wb.getWorksheet("Prospect");
  if (!sheet) return;

  const headerRowIdx = findHeaderRow(sheet, ["Solution", "Client", "Prospect", "Status"]);
  if (!headerRowIdx) return;

  const headerRow = sheet.getRow(headerRowIdx);
  const cSolution = findColIndexes(headerRow, "Solution")[0];
  const cClient = findColIndexes(headerRow, "Client")[0];
  const cProspect = findColIndexes(headerRow, "Prospect")[0];
  const cStatus = findColIndexes(headerRow, "Status")[0];

  for (let r = headerRowIdx + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const clientName = asString(row.getCell(cClient).value);
    const prospect = asString(row.getCell(cProspect).value);
    const solution = asString(row.getCell(cSolution).value);
    const status = asString(row.getCell(cStatus).value);
    if (!clientName && !prospect) continue;
    if (!clientName) continue;

    const existing = await tx.prospect.findFirst({
      where: { clientName, prospect },
    });
    if (existing) continue;

    const client = await upsertClient(tx, clientName);

    await tx.prospect.create({
      data: {
        clientId: client.id,
        clientName,
        solution: solution || null,
        prospect: prospect || null,
        status: status || null,
      },
    });
  }
}

async function importCostSheet(wb: ExcelJS.Workbook, tx: Tx) {
  const sheet = wb.getWorksheet("Cost");
  if (!sheet) return;

  // Row 1 contains date columns, row 2.. contains items
  const header = sheet.getRow(1);
  const dateCols: { col: number; date: Date }[] = [];
  for (let c = 1; c <= header.cellCount; c++) {
    const d = asDate(header.getCell(c).value);
    if (d) dateCols.push({ col: c, date: new Date(d.getFullYear(), d.getMonth(), 1) });
  }

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = asString(row.getCell(2).value);
    if (!name) continue;

    const item = await tx.expenseItem.upsert({
      where: { name },
      create: { name, groupName: "Pengeluaran Teratur" },
      update: { groupName: "Pengeluaran Teratur" },
    });

    for (const dc of dateCols) {
      const amount = asNumber(row.getCell(dc.col).value);
      if (amount == null) continue;
      await tx.expenseValue.upsert({
        where: { itemId_month: { itemId: item.id, month: dc.date } },
        create: {
          itemId: item.id,
          month: dc.date,
          amount: new Prisma.Decimal(amount),
        },
        update: { amount: new Prisma.Decimal(amount) },
      });
    }
  }
}

async function importRemainingInvoiceSheet(wb: ExcelJS.Workbook, tx: Tx) {
  const sheet = wb.getWorksheet("Remaining Invoice");
  if (!sheet) return;

  const headerRowIdx = findHeaderRow(sheet, [
    "Project/Client",
    "No Quotation",
    "No PO",
    "Bulan",
    "Total After Tax",
  ]);
  if (!headerRowIdx) return;

  const headerRow = sheet.getRow(headerRowIdx);
  const cClient = findColIndexes(headerRow, "Project/Client")[0];
  const cQuotation = findColIndexes(headerRow, "No Quotation")[0];
  const cPo = findColIndexes(headerRow, "No PO")[0];
  const cMonth = findColIndexes(headerRow, "Bulan")[0];
  const cTotal = findColIndexes(headerRow, "Total")[0];
  const cAfterTax = findColIndexes(headerRow, "Total After Tax")[0];
  const cPayDate = findColIndexes(headerRow, "Tanggal Pembayaran")[0];

  for (let r = headerRowIdx + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const clientName = asString(row.getCell(cClient).value);
    const quotationNo = asString(row.getCell(cQuotation).value);
    if (!clientName && !quotationNo) continue;
    if (!clientName || !quotationNo) continue;

    const poNumber = asString(row.getCell(cPo).value);
    const month = asDate(row.getCell(cMonth).value);
    const amount = asNumber(row.getCell(cTotal).value);
    const amountAfterTax = asNumber(row.getCell(cAfterTax).value);
    const paymentDate = asDate(row.getCell(cPayDate).value);

    const client = await upsertClient(tx, clientName);
    const project = await findOrCreateProject(
      tx,
      client.id,
      `${clientName} - Invoice`,
      null,
      null,
      null
    );

    const existing = await tx.billing.findFirst({
      where: { projectId: project.id, quotationNo, month: month ?? undefined },
    });
    if (existing) continue;

    await tx.billing.create({
      data: {
        projectId: project.id,
        quotationNo,
        poNumber: poNumber || null,
        month,
        amount: amount != null ? new Prisma.Decimal(amount) : null,
        amountAfterTax:
          amountAfterTax != null ? new Prisma.Decimal(amountAfterTax) : null,
        invoiceStatus: paymentDate ? "PAID" : "SENT",
        paymentDate,
      },
    });
  }
}

async function importDsis2024Sheet(wb: ExcelJS.Workbook, tx: Tx) {
  const sheet = wb.getWorksheet("DSIS 2024");
  if (!sheet) return;

  const headerRowIdx = findHeaderRow(sheet, ["No Quotation", "Bulan", "Total After Tax"]);
  if (!headerRowIdx) return;
  const headerRow = sheet.getRow(headerRowIdx);

  const cQuotation = findColIndexes(headerRow, "No Quotation")[0];
  const cMonth = findColIndexes(headerRow, "Bulan")[0];
  const cTotal = findColIndexes(headerRow, "Total")[0];
  const cAfterTax = findColIndexes(headerRow, "Total After Tax")[0];
  const cPayStatus = findColIndexes(headerRow, "Status Pembayaran")[0];

  const client = await upsertClient(tx, "DSIS");
  const project = await findOrCreateProject(tx, client.id, "DSIS 2024", null, null, null);

  for (let r = headerRowIdx + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const quotationNo = asString(row.getCell(cQuotation).value);
    if (!quotationNo) continue;
    const month = asDate(row.getCell(cMonth).value);
    const amount = asNumber(row.getCell(cTotal).value);
    const amountAfterTax = asNumber(row.getCell(cAfterTax).value);
    const payStatus = asString(row.getCell(cPayStatus).value);

    const invoiceStatus = payStatus.toLowerCase() === "done" ? "PAID" : "SENT";

    const existing = await tx.billing.findFirst({
      where: { projectId: project.id, quotationNo, month: month ?? undefined },
    });
    if (existing) continue;

    await tx.billing.create({
      data: {
        projectId: project.id,
        quotationNo,
        month,
        amount: amount != null ? new Prisma.Decimal(amount) : null,
        amountAfterTax:
          amountAfterTax != null ? new Prisma.Decimal(amountAfterTax) : null,
        invoiceStatus,
        rawStatus: payStatus || null,
      },
    });
  }
}
