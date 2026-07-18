import type { InvoiceDocument, InvoiceLineItem } from "./types";
import { createDefaultInvoiceDocument, createLineItemId } from "./defaults";

export type InvoiceTemplateFaq = {
  q: string;
  a: string;
};

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
  /** Optional SEO authority block shown below the editor */
  detailTitle?: string;
  detailParagraphs?: string[];
  faq?: InvoiceTemplateFaq[];
  /** Accessible description for the live invoice preview */
  previewAlt?: string;
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
    metaTitle: "Free Professional Plumber Invoice Template | Customizable PDF",
    metaDescription:
      "Download a professional plumber invoice and quote template. Fully customizable, secure, and ready for your business. Manage your plumbing jobs easily with JoinMyPDF.",
    h1: "Free Plumber Invoice & Quote Template | Download & Edit",
    lede:
      "A plumber invoice template and plumbing quote template in one: pre-filled service call, labor, and parts lines so you can create professional plumbing documents on site—then export PDF locally.",
    keywords: [
      "Plumber invoice template",
      "plumbing quote template",
      "professional plumbing documents",
      "business invoice maker",
    ],
    detailTitle: "Professional Plumber Invoice/Quote Template",
    detailParagraphs: [
      "A polished Plumber invoice template helps plumbing businesses look established from the first service call. Clear branding, consistent layout, and itemized labor and parts build trust with homeowners and commercial clients—and signal professionalism before you even start the job.",
      "Use the same layout as a plumbing quote template: edit company details, swap sample line items for diagnostics, emergency call-outs, or install work, adjust tax, and turn an estimate into an invoice when the job is approved. This business invoice maker keeps quotes and invoices aligned so customers always see professional plumbing documents.",
      "Unlike cloud editors that upload job details to a remote server, JoinMyPDF runs local-first in your browser. Customer names, addresses, and pricing stay on your device while you edit—ideal when privacy matters for residential and commercial plumbing work.",
      "Download your finished PDF when you are ready, print it on site, or email it from your own inbox. No account is required, and you can reuse the template for every job without rebuilding professional plumbing documents from scratch.",
    ],
    previewAlt:
      "Live preview of a free professional plumber invoice and quote template showing service call, labor, and parts line items ready to customize and download as PDF",
    faq: [
      {
        q: "How can I customize this template?",
        a: "Edit any field in the form—business name, customer details, tax rate, and line items for service calls, labor hours, and parts. The live preview updates instantly so you can tailor this Plumber invoice template or plumbing quote template before you export.",
      },
      {
        q: "Is this template free to use?",
        a: "Yes. The plumber invoice and quote template is free to use with no account, no watermark, and no subscription. Create as many professional plumbing documents as you need with this business invoice maker.",
      },
      {
        q: "Can I export as PDF?",
        a: "Yes. When your invoice or quote looks right, export a print-ready PDF directly from your browser. Processing is local-first, so job details are not uploaded to JoinMyPDF servers.",
      },
    ],
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
  {
    slug: "graphic-designer",
    profession: "graphic designer",
    professionLabel: "Graphic Designer",
    locale: "en-US",
    metaTitle: "Free Graphic Designer Invoice Template | JoinMyPDF",
    metaDescription:
      "Download a polished graphic design invoice with brand, print, and revision line items. Edit in your browser and export PDF instantly—no uploads, no watermark.",
    h1: "Free invoice template for graphic designers",
    lede:
      "Invoice logo packages, social assets, and print-ready deliverables with rates freelancers actually charge—adjust quantities, tax, and client details, then download your PDF.",
    keywords: [
      "graphic designer invoice template",
      "freelance designer billing",
      "logo design invoice",
    ],
    seed: {
      invoiceNumber: "GD-2026-042",
      from: {
        companyName: "Pixel & Ink Studio",
        email: "billing@pixelink.example",
        address: "77 Design District\nChicago, IL 60607",
      },
      to: {
        companyName: "Brightline Retail Group",
        email: "marketing@brightline.example",
      },
      taxPercent: 0,
      lineItems: [
        { description: "Brand identity package (logo + color + type)", quantity: 1, price: 1850 },
        { description: "Social media template kit (12 layouts)", quantity: 1, price: 620 },
        { description: "Print-ready packaging artwork", quantity: 3, price: 275 },
        { description: "Revision round (minor tweaks)", quantity: 1, price: 180 },
      ],
    },
  },
  {
    slug: "virtual-assistant",
    profession: "virtual assistant",
    professionLabel: "Virtual Assistant",
    locale: "en-US",
    metaTitle: "Free Virtual Assistant Invoice Template | JoinMyPDF",
    metaDescription:
      "Bill admin hours, inbox management, and research tasks with a VA invoice template. 100% client-side—edit, preview, and download PDF in minutes.",
    h1: "Free invoice template for virtual assistants",
    lede:
      "Track retainer hours, project blocks, and ad-hoc admin work with line items clients understand—perfect for solo VAs and boutique assistant agencies.",
    keywords: [
      "virtual assistant invoice",
      "VA billing template",
      "freelance admin invoice",
    ],
    seed: {
      invoiceNumber: "VA-2026-118",
      from: {
        companyName: "Remote Desk Partners",
        email: "invoices@remotedesk.example",
      },
      to: {
        companyName: "Founder Ops LLC",
        email: "finance@founderops.example",
      },
      taxPercent: 0,
      lineItems: [
        { description: "Monthly retainer (20 admin hours)", quantity: 1, price: 720 },
        { description: "Inbox + calendar management (hourly)", quantity: 8, price: 38 },
        { description: "CRM data cleanup & tagging", quantity: 1, price: 195 },
        { description: "Research & meeting notes (hourly)", quantity: 4, price: 42 },
      ],
    },
  },
  {
    slug: "tutor",
    profession: "tutor",
    professionLabel: "Tutor / Private Teacher",
    locale: "en-US",
    metaTitle: "Free Tutor Invoice Template | JoinMyPDF",
    metaDescription:
      "Invoice private lessons, exam prep, and online tutoring sessions. Free browser template with session bundles and materials fees—private PDF download.",
    h1: "Free invoice template for tutors & private teachers",
    lede:
      "Charge per session, monthly packages, or exam-prep blocks with education-friendly line items—ideal for in-person tutors and online teachers billing parents or schools.",
    keywords: [
      "tutor invoice template",
      "private teacher billing",
      "tutoring session invoice",
    ],
    seed: {
      invoiceNumber: "EDU-2026-305",
      from: {
        companyName: "Harbor Learning Tutoring",
        email: "billing@harborlearning.example",
        address: "14 Campus Walk\nCambridge, MA 02138",
      },
      to: {
        companyName: "Parent / Guardian",
        email: "accounts@family.example",
      },
      taxPercent: 0,
      lineItems: [
        { description: "1:1 tutoring session (60 min)", quantity: 8, price: 65 },
        { description: "Exam prep intensive (90 min)", quantity: 4, price: 95 },
        { description: "Practice workbook & materials fee", quantity: 1, price: 45 },
        { description: "Progress report & parent conference", quantity: 1, price: 55 },
      ],
    },
  },
  {
    slug: "fitness-coach",
    profession: "fitness coach",
    professionLabel: "Fitness Coach / Personal Trainer",
    locale: "en-US",
    metaTitle: "Free Personal Trainer Invoice Template | JoinMyPDF",
    metaDescription:
      "Invoice training packages, nutrition check-ins, and gym sessions with a fitness coach template. Edit locally and download PDF—no client data upload.",
    h1: "Free invoice template for fitness coaches & personal trainers",
    lede:
      "Sell session packs, online coaching, and assessment fees with pre-filled wellness line items—customize for gym, studio, or remote coaching clients.",
    keywords: [
      "personal trainer invoice",
      "fitness coach billing template",
      "gym training invoice",
    ],
    seed: {
      invoiceNumber: "FIT-2026-077",
      from: {
        companyName: "Peak Form Coaching",
        email: "hello@peakform.example",
        address: "220 Wellness Blvd\nDenver, CO 80202",
      },
      to: {
        companyName: "Client Membership",
      },
      taxPercent: 7.5,
      lineItems: [
        { description: "Personal training session (60 min)", quantity: 12, price: 75 },
        { description: "Custom training plan (4-week block)", quantity: 1, price: 220 },
        { description: "Nutrition check-in call (30 min)", quantity: 4, price: 45 },
        { description: "Body composition assessment", quantity: 1, price: 85 },
      ],
    },
  },
  {
    slug: "web-developer",
    profession: "web developer",
    professionLabel: "Web Developer",
    locale: "en-US",
    metaTitle: "Free Web Developer Invoice Template | JoinMyPDF",
    metaDescription:
      "Bill sprints, API integration, and bug-fix hours with a developer-focused invoice. Browser-based editor, live preview, client-side PDF export.",
    h1: "Free invoice template for web developers",
    lede:
      "Separate from design invoices—this template highlights engineering work: feature sprints, code reviews, deployments, and maintenance retainers at realistic dev rates.",
    keywords: [
      "web developer invoice template",
      "freelance developer billing",
      "software contractor invoice",
    ],
    seed: {
      invoiceNumber: "DEV-2026-519",
      from: {
        companyName: "Stackline Engineering",
        email: "billing@stackline.example",
        address: "901 Cloud Street, Unit 4\nSeattle, WA 98101",
      },
      to: {
        companyName: "SaaS Launch Co.",
        email: "ap@saaslaunch.example",
      },
      taxPercent: 0,
      lineItems: [
        { description: "Feature sprint (Next.js + API)", quantity: 32, price: 110 },
        { description: "Code review & QA pass", quantity: 6, price: 95 },
        { description: "Production deployment & monitoring setup", quantity: 1, price: 480 },
        { description: "Post-launch bug fixes (hourly)", quantity: 5, price: 105 },
      ],
    },
  },
  {
    slug: "social-media-manager",
    profession: "social media manager",
    professionLabel: "Social Media Manager",
    locale: "en-US",
    metaTitle: "Free Social Media Manager Invoice Template | JoinMyPDF",
    metaDescription:
      "Invoice content calendars, ad management, and community moderation. Free SMM invoice template with live preview—download PDF without uploading assets.",
    h1: "Free invoice template for social media managers",
    lede:
      "Bill monthly retainers, content production, paid social management, and reporting with line items tailored to agencies and freelance SMMs.",
    keywords: [
      "social media manager invoice",
      "SMM billing template",
      "content marketing invoice",
    ],
    seed: {
      invoiceNumber: "SMM-2026-204",
      from: {
        companyName: "Channel Rise Social",
        email: "invoices@channelrise.example",
      },
      to: {
        companyName: "DTC Brand House",
        email: "finance@dtcbrand.example",
      },
      taxPercent: 0,
      lineItems: [
        { description: "Monthly management retainer (2 networks)", quantity: 1, price: 1400 },
        { description: "Content batch (8 posts + captions)", quantity: 1, price: 520 },
        { description: "Paid ads setup & optimization", quantity: 1, price: 650 },
        { description: "Monthly analytics & strategy report", quantity: 1, price: 280 },
      ],
    },
  },
  {
    slug: "handyman",
    profession: "handyman",
    professionLabel: "Handyman / Contractor",
    locale: "en-US",
    metaTitle: "Free Handyman Invoice Template | JoinMyPDF",
    metaDescription:
      "Simple contractor invoice for labor, materials, and trip charges. Create and download PDF invoices on site—100% private, browser-based processing.",
    h1: "Free invoice template for handymen & contractors",
    lede:
      "Quote jobs with labor hours, materials markup, and trip fees already structured—ideal for home repair, small renovations, and independent contractors.",
    keywords: [
      "handyman invoice template",
      "contractor billing form",
      "home repair invoice",
    ],
    seed: {
      invoiceNumber: "HM-2026-8841",
      from: {
        companyName: "FixRight Home Services",
        email: "service@fixright.example",
        address: "3 Workshop Lane\nPhoenix, AZ 85004",
      },
      to: {
        companyName: "Homeowner",
      },
      taxPercent: 8.25,
      lineItems: [
        { description: "On-site service / trip charge", quantity: 1, price: 75 },
        { description: "Skilled labor (per hour)", quantity: 5, price: 88 },
        { description: "Materials & supplies", quantity: 1, price: 186 },
        { description: "Debris removal & cleanup", quantity: 1, price: 65 },
      ],
    },
  },
  {
    slug: "business-strategist",
    profession: "business strategist",
    professionLabel: "Business Strategist",
    locale: "en-US",
    metaTitle: "Free Business Strategist Invoice Template | JoinMyPDF",
    metaDescription:
      "Invoice strategy workshops, market analysis, and executive advisory hours. Professional template with PDF download—no cloud upload required.",
    h1: "Free invoice template for business strategists",
    lede:
      "Go beyond generic consulting—line items cover growth roadmaps, competitive analysis, and board-ready deliverables for strategy freelancers and boutique firms.",
    keywords: [
      "business strategist invoice",
      "strategy consultant billing",
      "advisory services invoice",
    ],
    seed: {
      invoiceNumber: "STRAT-2026-091",
      from: {
        companyName: "Northstar Strategy Partners",
        email: "billing@northstarstrategy.example",
        address: "1200 Executive Center Dr\nAtlanta, GA 30303",
      },
      to: {
        companyName: "ScaleUp Ventures Inc.",
        email: "cfo@scaleupventures.example",
      },
      taxPercent: 0,
      lineItems: [
        { description: "Growth strategy workshop (leadership team)", quantity: 1, price: 3200 },
        { description: "Market & competitor analysis deck", quantity: 1, price: 1450 },
        { description: "Executive advisory (hourly)", quantity: 10, price: 225 },
        { description: "90-day roadmap document + KPI framework", quantity: 1, price: 980 },
      ],
    },
  },
  {
    slug: "videographer",
    profession: "videographer",
    professionLabel: "Videographer",
    locale: "en-US",
    metaTitle: "Free Videographer Invoice Template | JoinMyPDF",
    metaDescription:
      "Invoice video shoots, editing, and licensing with a videographer template. Browser editor, A4 preview, and instant client-side PDF download.",
    h1: "Free invoice template for videographers",
    lede:
      "Complement photo billing with shoot days, edit hours, color grade, and delivery formats—built for weddings, corporate film, and content creators.",
    keywords: [
      "videographer invoice template",
      "video production billing",
      "freelance filmmaker invoice",
    ],
    seed: {
      invoiceNumber: "VID-2026-063",
      from: {
        companyName: "Frame & Motion Studio",
        email: "billing@frameandmotion.example",
        address: "48 Production Alley\nLos Angeles, CA 90028",
      },
      to: {
        companyName: "Brand Film Client",
        email: "production@brandfilm.example",
      },
      taxPercent: 9.5,
      lineItems: [
        { description: "Full-day video shoot (crew + gear)", quantity: 1, price: 1650 },
        { description: "Video editing (per finished minute)", quantity: 4, price: 350 },
        { description: "Color grade & sound mix", quantity: 1, price: 480 },
        { description: "Social cut-downs (3 variants)", quantity: 3, price: 175 },
      ],
    },
  },
  {
    slug: "translator",
    profession: "translator",
    professionLabel: "Translator / Localizer",
    locale: "en-US",
    metaTitle: "Free Translator Invoice Template | JoinMyPDF",
    metaDescription:
      "Bill per word, per page, and localization QA with a translator invoice template. Edit in browser, preview A4 layout, download PDF privately.",
    h1: "Free invoice template for translators & localizers",
    lede:
      "Pre-filled with translation, proofreading, and localization engineering lines—set your per-word rate, adjust language pairs, and invoice agencies or direct clients.",
    keywords: [
      "translator invoice template",
      "localization billing",
      "freelance translation invoice",
    ],
    seed: {
      invoiceNumber: "L10N-2026-441",
      from: {
        companyName: "Bridge Language Services",
        email: "invoices@bridgelanguage.example",
        address: "6 Global Plaza\nMontreal, QC H3B 2Y5",
      },
      to: {
        companyName: "Software Localization Team",
        email: "vendor-mgmt@softwarel10n.example",
      },
      taxPercent: 0,
      lineItems: [
        { description: "Translation (per 1,000 words, EN→FR)", quantity: 12, price: 95 },
        { description: "Bilingual proofreading (per 1,000 words)", quantity: 12, price: 42 },
        { description: "UI string localization + context notes", quantity: 1, price: 380 },
        { description: "Rush delivery surcharge (48h)", quantity: 1, price: 150 },
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
