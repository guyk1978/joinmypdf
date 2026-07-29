const fs = require("fs");

const files = [
  "src/app/[locale]/about/page.tsx",
  "src/app/[locale]/all-tools/page.tsx",
  "src/app/[locale]/blog/page.tsx",
  "src/app/[locale]/compare/page.tsx",
  "src/app/[locale]/guide/page.tsx",
  "src/app/[locale]/privacy/page.tsx",
  "src/app/[locale]/privacy-policy/page.tsx",
  "src/app/[locale]/projects/page.tsx",
  "src/app/[locale]/search/page.tsx",
  "src/app/[locale]/terms/page.tsx",
];

for (const file of files) {
  let c = fs.readFileSync(file, "utf8");
  // Fix mangled: const canonicalPath = `...` };
  c = c.replace(
    /const canonicalPath = (`[^`]+`) \};\s*return \{\s*title,\s*description,\s*\.\.\.buildPageSocialMetadata\(\{ locale, title, description, canonicalPath \}\),\s*alternates: \{\s*canonical: canonicalPath,\s*\};/,
    `const canonicalPath = $1;
  return {
    title,
    description,
    ...buildPageSocialMetadata({ locale, title, description, canonicalPath }),
    alternates: {
      canonical: canonicalPath,
    },
  };`,
  );
  fs.writeFileSync(file, c);
  console.log("fixed", file);
}
