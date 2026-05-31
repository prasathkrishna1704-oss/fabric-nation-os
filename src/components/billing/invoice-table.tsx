"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteInvoice } from "@/actions/billing";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Printer, Trash2, Search } from "lucide-react";
import type { Invoice, InvoiceItem } from "@generated/prisma";

type InvoiceWithItems = Invoice & { items: InvoiceItem[] };

interface InvoiceTableProps {
  invoices: InvoiceWithItems[];
  role?: string | null;
}

const statusStyles: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PARTIAL: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  UNPAID: "bg-red-500/15 text-red-400 border-red-500/30",
};

const typeStyles: Record<string, string> = {
  GST: "bg-primary/15 text-primary border-primary/30",
  NON_GST: "bg-muted text-muted-foreground border-border",
};

export function InvoiceTable({ invoices, role }: InvoiceTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = invoices.filter((inv) => {
    const matchSearch = !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchType = typeFilter === "all" || inv.type === typeFilter;
    const matchStatus = statusFilter === "all" || inv.paymentStatus === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleDelete = (id: string, invoiceNumber: string) => {
    if (!confirm(`Delete ${invoiceNumber}? Stock will be restored.`)) return;
    startTransition(async () => {
      await deleteInvoice(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." className="pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="GST">GST Invoice</SelectItem>
            <SelectItem value="NON_GST">Cash Bill</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/20 group">
                  <TableCell>
                    <Link href={`/billing/${inv.id}`} className="font-semibold text-primary hover:underline text-sm">
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{inv.customerName || <span className="text-muted-foreground">Walk-in</span>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(inv.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${typeStyles[inv.type]}`}>
                      {inv.type === "GST" ? "GST" : "Cash"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{inv.items.length}</TableCell>
                  <TableCell className="text-right text-sm font-bold text-foreground">{formatCurrency(inv.totalAmount)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inv.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${statusStyles[inv.paymentStatus]}`}>
                      {inv.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/billing/${inv.id}`)} className="gap-2"><Eye className="w-3.5 h-3.5" /> View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/billing/${inv.id}?print=1`, "_blank")} className="gap-2">
                          <Printer className="w-3.5 h-3.5" /> Print
                        </DropdownMenuItem>
                        {role === "admin" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-400 gap-2" onClick={() => handleDelete(inv.id, inv.invoiceNumber)}>
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} of {invoices.length} invoices</p>
    </div>
  );
}
