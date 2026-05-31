"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATE_CODES } from "@/lib/gst-engine";
import { Loader2, UserPlus } from "lucide-react";
import type { Customer } from "@generated/prisma";

interface CustomerFormProps {
  customer?: Customer;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    gstin: customer?.gstin ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    stateCode: customer?.stateCode ?? "",
    pincode: customer?.pincode ?? "",
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createCustomer({
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        gstin: form.gstin || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        stateCode: form.stateCode || undefined,
        pincode: form.pincode || undefined,
      });
      router.push("/customers");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold">Basic Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="cust-name">Full Name *</Label>
            <Input id="cust-name" placeholder="e.g. Lakshmi Textiles" required {...field("name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-phone">Phone</Label>
            <Input id="cust-phone" placeholder="9876543210" {...field("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-email">Email</Label>
            <Input id="cust-email" type="email" placeholder="email@example.com" {...field("email")} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="cust-gstin">GSTIN (for GST Invoices)</Label>
            <Input id="cust-gstin" placeholder="22AAAAA0000A1Z5" className="font-mono" {...field("gstin")} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold">Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="cust-address">Street Address</Label>
            <Input id="cust-address" placeholder="Street address" {...field("address")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-city">City</Label>
            <Input id="cust-city" placeholder="Chennai" {...field("city")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-state">State</Label>
            <Select value={form.stateCode} onValueChange={(v) => setForm((f) => ({ ...f, stateCode: v ?? "" }))}>
              <SelectTrigger id="cust-state"><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATE_CODES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{code} — {name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-pincode">Pincode</Label>
            <Input id="cust-pincode" placeholder="600017" {...field("pincode")} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/customers")}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {customer ? "Update Customer" : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
