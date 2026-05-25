import type { InvoiceDocument, InvoiceLineItem } from "./types";
import { createDefaultInvoiceDocument, createLineItemId } from "./defaults";

export type InvoiceTemplateProfile = {
  slug: string;
  profession: string;
  professionLabel: string;
  locale: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lede: string;
  keywords: string[];
  seed: {
    invoiceNumber?: string;
    from?: Partial<InvoiceDocument["from"]>;
    to?: Partial<InvoiceDocument["to"]>;
    taxPercent?: number;
    lineItems: Omit<InvoiceLineItem, "id">[];
  };
};

export const INVOICE_TEMPLATE_PROFILES: InvoiceTemplateProfile[] = [
  {
    slug: "web-designer",
    profession: "web designer",
    professionLabel: "Web Designer",
    locale: "en-US",
    metaTitle: "Free Invoice Template for Web Designers",
    metaDescription:
      "Create and download a professional web design invoice in your browser. Pre-filled line items for UI design, development, and revisions—100% client-side, no upload.",
    h1: "Free invoice template for web designers",
    lede:
      "Bill clients for design systems, mockups, and front-end delivery with a ready-made layout. Edit line items, tax, and branding, then export a PDF locally.",
    keywords: ["web design invoice", "freelance designer invoice", "UI UX invoice template"],
    seed: {
      invoiceNumber: "WD-2026-001",
      from: {
        companyName: "Studio North Digital",
        email: "hello@studionorth.example",
        address: "42 Creative Lane\nBrooklyn, NY 11201",
      },
      to: {
        companyName: "Client Brand Co.",
        email: "projects@clientbrand.example",
      },
      taxPercent: 0,
      lineItems: [
        { description: "Homepage UI design (Figma + handoff)", quantity: 1, price: 1200 },
        { description: "Responsive front-end implementation", quantity: 12, price: 95 },
        { description: "Design revision round", quantity: 2, price: 150 },
      ],
    },
  },
  {
    slug: "photographer",
    profession: "photographer",
    professionLabel: "Photographer",
    locale: "en-US",
    metaTitle: "Free Invoice Template for Photographers",
    metaDescription:
      "Invoice photography sessions, editing, and print licensing with a free browser-based template. Live A4 preview and private PDF download.",
    h1: "Free invoice template for photographers",
    lede:
      "Perfect for wedding, portrait, and commercial shoots—pre-loaded with session, retouching, and usage fee line items you can customize in seconds.",
    keywords: ["photography invoice template", "wedding photographer invoice", "photo session billing"],
    seed: {
      invoiceNumber: "PHOTO-2026-014",
      from: {
        companyName: "Aperture Lane Photography",
        email: "billing@aperturelane.example",
        address: "9 Gallery Row\nPortland, OR 97209",
      },
      taxPercent: 8.5,
      lineItems: [
        { description: "Half-day on-location shoot", quantity: 1, price: 850 },
        { description: "Professional retouching (per image)", quantity: 40, price: 12 },
        { description: "Commercial usage license (1 year)", quantity: 1, price: 400 },
      ],
    },
  },
  {
    slug: "copywriter",
    profession: "copywriter",
    professionLabel: "Copywriter",
    locale: "en-US",
    metaTitle: "Free Invoice Template for Copywriters",
    metaDescription:
      "Bill per word, per page, or per project with a copywriting invoice template. Edit in the browser and download PDF without uploading client briefs.",
    h1: "Free invoice template for copywriters",
    lede:
      "Start from copywriting-friendly line items—blog posts, landing pages, and email sequences—then tailor rates and tax for your market.",
    keywords: ["copywriter invoice", "freelance writing invoice", "content writer billing"],
    seed: {
      invoiceNumber: "COPY-2026-088",
      from: {
        companyName: "Clear Voice Copy",
        email: "invoices@clearvoice.example",
      },
      to: {
        companyName: "Growth Marketing Ltd.",
        email: "ap@growthmarketing.example",
      },
      taxPercent: 0,
      lineItems: [
        { description: "Landing page copy (research + 2 drafts)", quantity: 1, price: 650 },
        { description: "Blog article (~1,200 words)", quantity: 4, price: 275 },
        { description: "Email nurture sequence (5 emails)", quantity: 1, price: 900 },
      ],
    },
  },
  {
    slug: "consultant",
    profession: "consultant",
    professionLabel: "Consultant",
    locale: "en-US",
    metaTitle: "Free Invoice Template for Consultants",
    metaDescription:
      "Professional consulting invoice template with hourly and workshop line items. Client-side PDF export for strategy, IT, and business advisors.",
    h1: "Free invoice template for consultants",
    lede:
      "Charge for discovery workshops, hourly advisory, and deliverable milestones with a polished invoice your clients expect from consulting firms.",
    keywords: ["consulting invoice template", "hourly consultant invoice", "advisory services billing"],
    seed: {
      invoiceNumber: "CONS-2026-220",
      from: {
        companyName: "Summit Advisory Group",
        email: "billing@summitadvisory.example",
        address: "500 Market Street, Suite 1200\nSan Francisco, CA 94105",
      },
      taxPercent: 0,
      lineItems: [
        { description: "Discovery workshop (full day)", quantity: 1, price: 2400 },
        { description: "Senior consultant hourly rate", quantity: 18, price: 185 },
        { description: "Executive summary report", quantity: 1, price: 750 },
      ],
    },
  },
  {
    slug: "plumber",
    profession: "plumber",
    professionLabel: "Plumber",
    locale: "en-US",
    metaTitle: "Free Invoice Template for Plumbers",
    metaDescription:
      "Simple plumbing invoice template for service calls, parts, and labor. Fill out in the browser and download a PDF invoice—no cloud upload.",
    h1: "Free invoice template for plumbers",
    lede:
      "Built for trades: service call fees, labor hours, and parts lines are pre-filled so you can invoice jobs from your phone or laptop on site.",
    keywords: ["plumber invoice template", "trades invoice", "home services billing"],
    seed: {
      invoiceNumber: "JOB-2026-3317",
      from: {
        companyName: "Metro Flow Plumbing",
        email: "service@metroflow.example",
        address: "18 Industrial Park Rd\nAustin, TX 78745",
      },
      to: {
        companyName: "Residential Customer",
      },
      taxPercent: 8.25,
      lineItems: [
        { description: "Service call / diagnostic fee", quantity: 1, price: 89 },
        { description: "Labor (per hour)", quantity: 2.5, price: 95 },
        { description: "Parts & materials", quantity: 1, price: 142.5 },
      ],
    },
  },
];

const bySlug = new Map(INVOICE_TEMPLATE_PROFILES.map((p) => [p.slug, p]));

export function getInvoiceTemplateBySlug(slug: string): InvoiceTemplateProfile | undefined {
  return bySlug.get(slug);
}

export function createInvoiceDocumentForTemplate(profile: InvoiceTemplateProfile): InvoiceDocument {
  const base = createDefaultInvoiceDocument();
  const seed = profile.seed;

  return {
    ...base,
    invoiceNumber: seed.invoiceNumber ?? base.invoiceNumber,
    taxPercent: seed.taxPercent ?? base.taxPercent,
    from: { ...base.from, ...seed.from },
    to: { ...base.to, ...seed.to },
    lineItems: seed.lineItems.map((item) => ({
      ...item,
      id: createLineItemId(),
    })),
  };
}
