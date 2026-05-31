"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import type { Product } from "@generated/prisma";

export function PrintQrDialog({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const qrRef = useRef<HTMLCanvasElement>(null);

  if (!product) return null;

  const handlePrint = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR - ${product.name}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; background: white; color: black; }
              img { max-width: 100%; height: auto; }
              .details { margin-top: 1rem; text-align: center; font-family: system-ui, -apple-system, sans-serif; }
              h2 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
              p { margin: 0.25rem 0; font-size: 0.875rem; color: #4b5563; }
              .id { font-family: monospace; font-size: 0.75rem; color: #6b7280; }
              @media print {
                @page { margin: 0; }
                body { margin: 1cm; justify-content: flex-start; }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <div class="details">
              <h2>${product.name}</h2>
              <p>Rs. ${product.sellingPrice} / ${product.unit}</p>
              <p class="id">${product.id}</p>
            </div>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-2xl shadow-xl border border-border w-full max-w-sm overflow-hidden scale-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-semibold text-sm">Fabric QR Code</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-8 flex flex-col items-center space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm ring-1 ring-border">
            <QRCodeCanvas
              id="qr-canvas"
              ref={qrRef}
              value={product.id}
              size={200}
              level="M"
              includeMargin={true}
            />
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-semibold text-base">{product.name}</p>
            <p className="text-sm text-muted-foreground">Rs. {product.sellingPrice} / {product.unit}</p>
            <p className="text-[10px] text-muted-foreground/60 font-mono tracking-wider">{product.id}</p>
          </div>
        </div>
        <div className="p-4 border-t border-border/50 flex justify-end gap-3 bg-muted/10">
          <Button variant="outline" onClick={onClose} className="rounded-lg">Cancel</Button>
          <Button onClick={handlePrint} className="gap-2 rounded-lg">
            <Printer className="w-4 h-4" />
            Print Tag
          </Button>
        </div>
      </div>
    </div>
  );
}
