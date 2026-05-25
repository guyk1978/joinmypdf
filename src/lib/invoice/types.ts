export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

export type PartyInfo = {
  companyName: string;
  email: string;
  address: string;
};

export type InvoiceDocument = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  from: PartyInfo;
  to: PartyInfo;
  lineItems: InvoiceLineItem[];
  taxPercent: number;
};

export type InvoiceTotals = {
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
};

export type InvoiceExportPayload = InvoiceDocument & {
  totals: InvoiceTotals;
  generatedAt: string;
};
