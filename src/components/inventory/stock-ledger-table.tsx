import { formatQuantity, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowUpCircle, ArrowDownCircle, SlidersHorizontal } from "lucide-react";
import type { Product, StockLedger } from "@generated/prisma";

type LedgerEntry = StockLedger & { product: Product };

interface StockLedgerTableProps {
  entries: LedgerEntry[];
}

const typeConfig = {
  INWARD: { label: "Inward", icon: ArrowUpCircle, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  OUTWARD: { label: "Outward", icon: ArrowDownCircle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
  ADJUSTMENT: { label: "Adjustment", icon: SlidersHorizontal, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
};

export function StockLedgerTable({ entries }: StockLedgerTableProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Date & Time</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Qty Change</TableHead>
            <TableHead className="text-right">Balance After</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                No stock movements recorded yet
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => {
              const config = typeConfig[entry.type as keyof typeof typeConfig];
              const Icon = config.icon;
              return (
                <TableRow key={entry.id} className="hover:bg-muted/20">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{entry.product.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.product.category}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs gap-1 ${config.bg}`}>
                      <Icon className={`w-3 h-3 ${config.color}`} />
                      <span className={config.color}>{config.label}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{entry.referenceType || "—"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-semibold ${entry.quantity >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {entry.quantity >= 0 ? "+" : ""}
                      {formatQuantity(entry.quantity, entry.product.unit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {formatQuantity(entry.balanceAfter, entry.product.unit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {entry.notes || "—"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
