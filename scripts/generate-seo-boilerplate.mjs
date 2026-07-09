import fs from "node:fs";

const CANDIDATES = [
  { slug: "pdf-password-recovery", overrideKey: "pdfPasswordRecovery" },
  { slug: "base64-encoder-decoder", overrideKey: "base64EncoderDecoder" },
  { slug: "url-encoder-decoder", overrideKey: "urlEncoderDecoder" },
  { slug: "text-diff-checker", overrideKey: "textDiffChecker" },
  { slug: "string-generator", overrideKey: "stringGenerator" },
  { slug: "word-character-counter", overrideKey: "wordCharacterCounter" },
  { slug: "yaml-json-converter", overrideKey: "yamlJsonConverter" },
  { slug: "csv-to-markdown-table", overrideKey: "csvToMarkdownTable" },
  { slug: "sql-query-formatter", overrideKey: "sqlQueryFormatter" },
  { slug: "password-generator", overrideKey: "passwordGenerator" },
  { slug: "hash-generator", overrideKey: "hashGenerator" },
  { slug: "uuid-generator", overrideKey: "uuidGenerator" },
  { slug: "unit-converter", overrideKey: "unitConverter" },
  { slug: "timezone-converter", overrideKey: "timezoneConverter" },
  { slug: "reading-time-calculator", overrideKey: "readingTimeCalculator" },
];

const tools = JSON.parse(fs.readFileSync("assets/data/tools.json", "utf8")).tools;
const bySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));

function buildEn(tool) {
  const title = tool.title;
  const kw = tool.primaryKeyword;
  const intent = tool.intent.replace(/\.$/, "");
  return {
    h1: `Free ${title} Online`,
    heroTagline: `${intent}.`,
    introSectionTitle: `How to Use ${title}`,
    whySectionTitle: `Why Use Our ${title}?`,
    whySectionSubheadline: `Secure local-only processing, privacy-first ${kw}, and instant results in your browser—no uploads or account required.`,
    schemaDescription: `${kw.toLowerCase().includes("online") ? `${kw} for free` : `${kw} online for free`}—${title.toLowerCase()} in your browser. 100% client-side with no data logging.`,
    relatedWorkflowLinks: {
      prompt: "Related utilities:",
      jsonFormatterLabel: "JSON Formatter",
      passwordGeneratorLabel: "Password Generator",
    },
    whyBenefits: {
      lossless: {
        title: "100% Client-side (no data leaves your browser)",
        body: `Secure local-only processing—${intent.toLowerCase()} without cloud services that store your inputs.`,
      },
      quality: {
        title: "Fast, precise results",
        body: `Purpose-built for ${kw} with clear output you can copy or download instantly.`,
      },
      local: {
        title: "Privacy-first tool",
        body: "No server uploads, no tracking on your content, and no account required for everyday use.",
      },
    },
  };
}

function buildHe(tool) {
  const title = tool.title;
  const kw = tool.primaryKeyword;
  const intent = tool.intent.replace(/\.$/, "");
  return {
    h1: `${title} חינם אונליין`,
    heroTagline: `${intent}.`,
    introSectionTitle: `איך להשתמש ב-${title}`,
    whySectionTitle: `למה להשתמש ב-${title} שלנו?`,
    whySectionSubheadline: `עיבוד מקומי מאובטח בלבד, ${kw} ממוקד פרטיות ותוצאות מיידיות בדפדפן — ללא העלאות או חשבון.`,
    schemaDescription: `${kw.toLowerCase().includes("online") ? `${kw} בחינם` : `${kw} אונליין בחינם`} — ${title.toLowerCase()} בדפדפן. 100% בצד הלקוח ללא לוגים.`,
    relatedWorkflowLinks: {
      prompt: "כלים קשורים:",
      jsonFormatterLabel: "מעצב JSON",
      passwordGeneratorLabel: "מחולל סיסמאות",
    },
    whyBenefits: {
      lossless: {
        title: "100% בצד הלקוח (הנתונים לא עוזבים את הדפדפן)",
        body: `עיבוד מקומי מאובטח בלבד — ${intent.toLowerCase()} בלי שירותי ענן ששומרים את הקלט שלך.`,
      },
      quality: {
        title: "תוצאות מהירות ומדויקות",
        body: `בנוי במיוחד עבור ${kw} עם פלט ברור להעתקה או הורדה מיידית.`,
      },
      local: {
        title: "כלי ממוקד פרטיות",
        body: "ללא העלאות לשרת, ללא מעקב אחר התוכן שלך וללא חשבון לשימוש יומיומי.",
      },
    },
  };
}

function guideP1(locale, tool) {
  const intent = tool.intent.replace(/\.$/, "");
  if (locale === "he") {
    return `${intent} — עיבוד מקומי מאובטח בלבד בדפדפן. ללא העלאות, ללא חשבון וללא תוכנת שולחן עבודה.`;
  }
  return `${intent}—secure local-only processing in your browser. No uploads, no account, and no desktop software required.`;
}

for (const locale of ["en", "he"]) {
  const path = `messages/locale-extensions/${locale}.json`;
  const data = JSON.parse(fs.readFileSync(path, "utf8"));
  const toolSeo = data.ToolPage.toolSeo;
  const guideOverrides = data.ToolPage.guide.toolOverrides;

  for (const { slug, overrideKey } of CANDIDATES) {
    const tool = bySlug[slug];
    if (!tool) {
      console.warn(`missing tool ${slug}`);
      continue;
    }
    toolSeo[overrideKey] = locale === "en" ? buildEn(tool) : buildHe(tool);
    guideOverrides[overrideKey] = { p1: guideP1(locale, tool) };
  }

  fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Updated ${path}`);
}
