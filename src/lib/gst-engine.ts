/**
 * GST Calculation Engine for Fabric Store
 * Handles Intra-state (CGST + SGST) and Inter-state (IGST) calculations
 */

export interface GSTResult {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalWithTax: number;
}

export interface LineItemGST {
  quantity: number;
  rate: number;
  gstRate: number;
  isInterState: boolean;
}

/**
 * Calculate GST for a single line item
 */
export function calculateLineItemGST(item: LineItemGST): GSTResult {
  const subtotal = round(item.quantity * item.rate);
  const taxAmount = round(subtotal * (item.gstRate / 100));

  if (item.isInterState) {
    return {
      subtotal,
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      totalTax: taxAmount,
      totalWithTax: round(subtotal + taxAmount),
    };
  }

  const halfTax = round(taxAmount / 2);
  return {
    subtotal,
    cgst: halfTax,
    sgst: halfTax,
    igst: 0,
    totalTax: round(halfTax * 2),
    totalWithTax: round(subtotal + halfTax * 2),
  };
}

/**
 * Calculate GST totals for all line items
 */
export function calculateInvoiceTotals(
  items: LineItemGST[],
  discountPercent: number = 0
): {
  subtotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
} {
  let subtotal = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  for (const item of items) {
    const result = calculateLineItemGST(item);
    subtotal += result.subtotal;
    cgstAmount += result.cgst;
    sgstAmount += result.sgst;
    igstAmount += result.igst;
  }

  const discountAmount = round(subtotal * (discountPercent / 100));
  const discountedSubtotal = round(subtotal - discountAmount);

  // Recalculate tax on discounted amount
  if (discountPercent > 0) {
    const ratio = discountedSubtotal / subtotal || 0;
    cgstAmount = round(cgstAmount * ratio);
    sgstAmount = round(sgstAmount * ratio);
    igstAmount = round(igstAmount * ratio);
  }

  const totalAmount = round(discountedSubtotal + cgstAmount + sgstAmount + igstAmount);

  return {
    subtotal: round(subtotal),
    discountAmount,
    cgstAmount: round(cgstAmount),
    sgstAmount: round(sgstAmount),
    igstAmount: round(igstAmount),
    totalAmount,
  };
}

/**
 * Round to 2 decimal places
 */
function round(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Indian state codes for GST
 */
export const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "37": "Andhra Pradesh",
};

export const GST_RATES = [0, 5, 12,] as const;

export const SHOP_STATE_CODE = "33"; // Default: Tamil Nadu
