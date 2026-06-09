"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function str(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

function dt(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createProspect(formData: FormData) {
  const clientName = str(formData.get("clientName"));
  const solution = str(formData.get("solution")) || null;
  const prospect = str(formData.get("prospect")) || null;
  const status = str(formData.get("status")) || null;

  let clientId: string | null = null;
  if (clientName) {
    const client = await prisma.client.upsert({
      where: { name: clientName },
      create: { name: clientName },
      update: {},
    });
    clientId = client.id;
  }

  await prisma.prospect.create({
    data: {
      clientId,
      clientName: clientName || null,
      solution,
      prospect,
      status,
    },
  });

  redirect("/prospects");
}

export async function addFollowUp(prospectId: string, formData: FormData) {
  const dueDate = dt(str(formData.get("dueDate")));
  const note = str(formData.get("note"));
  if (!note) throw new Error("note wajib");

  await prisma.followUp.create({
    data: { prospectId, dueDate, note },
  });

  redirect(`/prospects/${prospectId}`);
}

export async function markFollowUpDone(followUpId: string, formData: FormData) {
  const prospectId = str(formData.get("prospectId"));
  await prisma.followUp.update({
    where: { id: followUpId },
    data: { status: "DONE" },
  });
  redirect(`/prospects/${prospectId}`);
}

