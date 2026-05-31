"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomers(search?: string) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { gstin: { contains: search } },
    ];
  }

  return prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { invoices: true } },
    },
  });
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  stateCode?: string;
  pincode?: string;
}) {
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      gstin: data.gstin || null,
      address: data.address || null,
      city: data.city || null,
      stateCode: data.stateCode || null,
      pincode: data.pincode || null,
    },
  });

  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(
  id: string,
  data: {
    name: string;
    phone?: string;
    email?: string;
    gstin?: string;
    address?: string;
    city?: string;
    stateCode?: string;
    pincode?: string;
  }
) {
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      gstin: data.gstin || null,
      address: data.address || null,
      city: data.city || null,
      stateCode: data.stateCode || null,
      pincode: data.pincode || null,
    },
  });

  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
}
