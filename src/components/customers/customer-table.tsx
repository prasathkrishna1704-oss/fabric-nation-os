"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCustomer } from "@/actions/customers";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Search, FileText } from "lucide-react";
import type { Customer } from "@generated/prisma";

type CustomerWithCount = Customer & { _count: { invoices: number } };

interface CustomerTableProps {
  customers: CustomerWithCount[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone?.includes(search) ?? false) ||
    (c.gstin?.includes(search) ?? false)
  );

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteCustomer(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Invoices</TableHead>
              <TableHead>Since</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/20 group">
                  <TableCell>
                    <p className="font-medium text-foreground text-sm">{customer.name}</p>
                    {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{customer.phone || "—"}</TableCell>
                  <TableCell>
                    {customer.gstin ? (
                      <span className="font-mono text-xs text-foreground">{customer.gstin}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{customer.city || "—"}</TableCell>
                  <TableCell>
                    {customer.stateCode ? (
                      <Badge variant="outline" className="text-xs">{customer.stateCode}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-xs">{customer._count.invoices}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/billing?search=${encodeURIComponent(customer.name)}`)} className="gap-2">
                          <FileText className="w-3.5 h-3.5" /> View Invoices
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-400 gap-2"
                          onClick={() => handleDelete(customer.id, customer.name)}>
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} of {customers.length} customers</p>
    </div>
  );
}
