import type { InvoiceDocument, InvoiceLineItem } from "./types";

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createLineItemId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyLineItem(): InvoiceLineItem {
  return {
    id: createLineItemId(),
    description: "",
    quantity: 1,
    price: 0,
  };
}

export function createDefaultInvoiceDocument(): InvoiceDocument {
  return {
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}001`,
    issueDate: isoDateOffset(0),
    dueDate: isoDateOffset(30),
    from: {
      companyName: "Your Company Ltd.",
      email: "billing@yourcompany.com",
      address: "123 Business Street\nCity, ST 10001",
    },
    to: {
      companyName: "Client Name",
      email: "accounts@client.com",
      address: "456 Client Avenue\nCity, ST 20002",
    },
    lineItems: [
      {
        id: createLineItemId(),
        description: "Professional services",
        quantity: 1,
        price: 250,
      },
    ],
    taxPercent: 17,
  };
}
