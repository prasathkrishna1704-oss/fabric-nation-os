"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteProduct } from "@/actions/inventory";
import { formatCurrency, formatQuantity } from "@/lib/format";
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
import { MoreHorizontal, Pencil, Trash2, Search, AlertTriangle, BookOpen, QrCode } from "lucide-react";
import type { Product } from "@generated/prisma";
import { PrintQrDialog } from "./print-qr-dialog";

interface ProductTableProps {
  products: Product[];
  role?: string | null;
}

export function ProductTable({ products, role }: ProductTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [printProduct, setPrintProduct] = useState<Product | null>(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.hsnCode?.includes(search) ?? false) ||
    (p.category?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (p.productCode?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (p.color?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const handleDelete = (id: string) => {
    if (!confirm("Deactivate this product? It won't appear in new invoices.")) return;
    startTransition(async () => {
      await deleteProduct(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="product-search"
          placeholder="Search fabrics..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[260px]">Product</TableHead>
              <TableHead>Colour</TableHead>
              <TableHead>HSN</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>GST %</TableHead>
              <TableHead className="text-center">Number of Rolls</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground text-sm">
                  {search ? "No products matching your search" : "No products yet — add your first fabric"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => {
                const isLow = product.currentStock <= product.lowStockThreshold;
                const isCritical = product.currentStock <= product.lowStockThreshold * 0.3;
                return (
                  <TableRow key={product.id} className="hover:bg-muted/20 group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isLow && (
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isCritical ? "text-red-400" : "text-amber-400"}`} />
                        )}
                        <div>
                          <p className="font-medium text-foreground text-sm">{product.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {product.productCode && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{product.productCode}</Badge>}
                            {product.category && <span className="text-xs text-muted-foreground">{product.category}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{product.color || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">{product.hsnCode || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{product.unit}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatCurrency(product.costPrice)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-foreground">
                      {formatCurrency(product.sellingPrice)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{product.gstRate}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-muted-foreground">{product.numberOfRolls || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-semibold ${isCritical ? "text-red-400" : isLow ? "text-amber-400" : "text-emerald-400"}`}>
                        {formatQuantity(product.currentStock, product.unit)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/inventory/${product.id}`)} className="gap-2">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/inventory/ledger?product=${product.id}`)} className="gap-2">
                            <BookOpen className="w-3.5 h-3.5" /> View Ledger
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setPrintProduct(product)} className="gap-2">
                            <QrCode className="w-3.5 h-3.5" /> Print QR Code
                          </DropdownMenuItem>
                          {role === "admin" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-400 gap-2" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="w-3.5 h-3.5" /> Deactivate
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} of {products.length} products</p>
      {printProduct && (
        <PrintQrDialog product={printProduct} onClose={() => setPrintProduct(null)} />
      )}
    </div>
  );
}
