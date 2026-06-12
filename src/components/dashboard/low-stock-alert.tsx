import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { formatQuantity } from "@/lib/format";
import type { Product } from "@generated/prisma";

interface LowStockAlertProps {
  products: Product[];
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
          <Package className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-sm font-medium text-[#4B4E53]">All stock levels healthy</p>
        <p className="text-[11px] text-[#4B4E53]/50 mt-1">No restocking needed</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((product) => {
        const isCritical = product.currentStock <= product.lowStockThreshold * 0.3;
        const percentage = product.lowStockThreshold > 0
          ? Math.min((product.currentStock / product.lowStockThreshold) * 100, 100)
          : 0;

        return (
          <div
            key={product.id}
            className="flex items-center gap-3 rounded-xl p-3 border border-[#E5EAF0] hover:border-[#D0D6DE] hover:bg-[#FAFBFC] transition-all duration-200 group"
          >
            {/* Status icon */}
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isCritical ? "bg-red-50" : "bg-amber-50"
            }`}>
              {isCritical
                ? <AlertTriangle className="w-4 h-4 text-red-600" />
                : <TrendingDown className="w-4 h-4 text-amber-600" />
              }
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1D1E27] truncate" title={`${product.name}${product.productCode ? ` (${product.productCode})` : ""}${product.color ? ` - ${product.color}` : ""}`}>
                {product.name}
                {product.productCode ? ` (${product.productCode})` : ""}
                {product.color ? ` - ${product.color}` : ""}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[11px] text-[#4B4E53]/60">{product.category}</p>
                {/* Mini progress bar */}
                <div className="flex-1 max-w-[60px] h-1 rounded-full bg-[#EDF2F4] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical ? "bg-red-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stock count */}
            <div className="text-right shrink-0">
              <span className={`text-xs font-bold ${isCritical ? "text-red-600" : "text-amber-600"}`}>
                {formatQuantity(product.currentStock, product.unit)}
              </span>
              <p className="text-[10px] text-[#4B4E53]/40 mt-0.5">
                min: {formatQuantity(product.lowStockThreshold, product.unit)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
