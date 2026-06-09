"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

function str(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

function dec(v: string) {
  if (!v) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return new Prisma.Decimal(n);
}

function dt(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createProject(formData: FormData) {
  const clientName = str(formData.get("clientName"));
  const projectName = str(formData.get("projectName"));
  const product = str(formData.get("product")) || null;
  const poNumber = str(formData.get("poNumber")) || null;
  const amountTotal = dec(str(formData.get("amountTotal")));

  if (!clientName || !projectName) throw new Error("clientName & projectName wajib.");

  const client = await prisma.client.upsert({
    where: { name: clientName },
    create: { name: clientName },
    update: {},
  });

  const project = await prisma.project.create({
    data: {
      clientId: client.id,
      projectName,
      product,
      poNumber,
      amountTotal,
    },
  });

  redirect(`/projects/${project.id}`);
}

export async function createBilling(projectId: string, formData: FormData) {
  const month = dt(str(formData.get("month")));
  const terminRatio = dec(str(formData.get("terminRatio")));
  const amount = dec(str(formData.get("amount")));
  const taxRate = dec(str(formData.get("taxRate"))) ?? new Prisma.Decimal(0.11);
  const amountAfterTax = dec(str(formData.get("amountAfterTax")));
  const quotationNo = str(formData.get("quotationNo")) || null;
  const poNumber = str(formData.get("poNumber")) || null;
  const notes = str(formData.get("notes")) || null;

  await prisma.billing.create({
    data: {
      projectId,
      month,
      terminRatio,
      amount,
      taxRate,
      amountAfterTax,
      quotationNo,
      poNumber,
      notes,
    },
  });

  redirect(`/projects/${projectId}`);
}

export async function updateBilling(billingId: string, formData: FormData) {
  const projectId = str(formData.get("projectId"));
  const invoiceStatus = str(formData.get("invoiceStatus")) as any;
  const invoiceDate = dt(str(formData.get("invoiceDate")));
  const paymentDate = dt(str(formData.get("paymentDate")));
  const paidAmount = dec(str(formData.get("paidAmount")));
  const rawStatus = str(formData.get("rawStatus")) || null;
  const notes = str(formData.get("notes")) || null;

  await prisma.billing.update({
    where: { id: billingId },
    data: {
      invoiceStatus,
      invoiceDate,
      paymentDate,
      paidAmount,
      rawStatus,
      notes,
    },
  });

  redirect(`/projects/${projectId}`);
}

