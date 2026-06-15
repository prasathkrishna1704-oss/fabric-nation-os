import { getProduct, getStockLedger } from "@/actions/inventory";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/components/inventory/product-form";
import { StockLedgerTable } from "@/components/inventory/stock-ledger-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, History, ShoppingCart, Pencil, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import { formatCurrency, formatQuantity, formatDateTime } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Fabric Details — Fabric Nation" };

interface Props { params: Promise<{ id: string }> }

export default async function FabricDetailsPage({ params }: Props) {
  const { id } = await params;
  
  const [product, ledger, sales, purchases] = await Promise.all([
    getProduct(id),
    getStockLedger(id),
    prisma.invoiceItem.findMany({
      where: { productId: id },
      include: { invoice: { include: { customer: true } } },
      orderBy: { invoice: { createdAt: "desc" } },
      take: 100,
    }),
    prisma.purchaseItem.findMany({
      where: { productId: id },
      include: { purchase: { include: { supplier: true } } },
      orderBy: { purchase: { createdAt: "desc" } },
      take: 100,
    }),
  ]);

  if (!product) notFound();

  const totalSold = sales.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = sales.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in space-y-6">
      <PageHeader title={product.name} description={`Code: ${product.productCode || "—"} · Category: ${product.category || "—"}`}>
        <Link href="/inventory">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-gray-500">Current Stock</p>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatQuantity(product.currentStock, product.unit)}</p>
        </div>

        <div className="premium-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-gray-500">Total Sold</p>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatQuantity(totalSold, product.unit)}</p>
        </div>

        <div className="premium-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-gray-500">Revenue Generated</p>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="premium-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-sm font-bold text-gray-500">Pricing</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(product.sellingPrice)} <span className="text-sm font-medium text-gray-400">/ {product.unit}</span></p>
        </div>
      </div>

      <Tabs defaultValue="ledger" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 lg:h-14 bg-[#EDF2F4] p-1.5 rounded-2xl border border-gray-200/50 shadow-inner h-auto">
          <TabsTrigger value="ledger" className="rounded-xl lg:h-full py-3 data-[state=active]:bg-white data-[state=active]:text-[#C80018] data-[state=active]:shadow-md font-bold text-gray-500 transition-all gap-2">
            <History className="w-4 h-4" /> Stock Ledger
          </TabsTrigger>
          <TabsTrigger value="sales" className="rounded-xl lg:h-full py-3 data-[state=active]:bg-white data-[state=active]:text-[#C80018] data-[state=active]:shadow-md font-bold text-gray-500 transition-all gap-2">
            <ShoppingCart className="w-4 h-4" /> Sales History
          </TabsTrigger>
          <TabsTrigger value="purchases" className="rounded-xl lg:h-full py-3 data-[state=active]:bg-white data-[state=active]:text-[#C80018] data-[state=active]:shadow-md font-bold text-gray-500 transition-all gap-2">
            <Package className="w-4 h-4" /> Purchases
          </TabsTrigger>
          <TabsTrigger value="edit" className="rounded-xl lg:h-full py-3 data-[state=active]:bg-white data-[state=active]:text-[#C80018] data-[state=active]:shadow-md font-bold text-gray-500 transition-all gap-2">
            <Pencil className="w-4 h-4" /> Edit Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-0 outline-none animate-slide-up">
          <StockLedgerTable entries={ledger} />
        </TabsContent>

        <TabsContent value="sales" className="mt-0 outline-none animate-slide-up">
          <div className="rounded-xl border border-border overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sales history found</TableCell></TableRow>
                ) : (
                  sales.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDateTime(s.invoice.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/billing/${s.invoice.id}`} className="text-[#C80018] hover:underline font-medium">
                          {s.invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{s.invoice.customerName || s.invoice.customer?.name || "Walk-in"}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 whitespace-nowrap">{formatQuantity(s.quantity, product.unit)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(s.rate)}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatCurrency(s.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="mt-0 outline-none animate-slide-up">
          <div className="rounded-xl border border-border overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Date</TableHead>
                  <TableHead>Purchase #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No purchase history found</TableCell></TableRow>
                ) : (
                  purchases.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDateTime(p.purchase.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/purchases/${p.purchase.id}`} className="text-[#C80018] hover:underline font-medium">
                          {p.purchase.purchaseNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{p.purchase.supplierName || p.purchase.supplier?.name || "Unknown"}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-600 whitespace-nowrap">{formatQuantity(p.quantity, product.unit)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(p.rate)}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatCurrency(p.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="edit" className="mt-0 outline-none animate-slide-up">
          <ProductForm product={product} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
