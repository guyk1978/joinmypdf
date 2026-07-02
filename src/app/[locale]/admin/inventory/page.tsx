import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppPageShell } from "@/components/AppPageShell";
import { ProductPageLayout } from "@/components/ProductPageLayout";
import { SiteInventoryTable } from "@/components/SiteInventoryTable";
import { isAdminInventoryEnabled } from "@/lib/admin-inventory";
import { buildSiteInventory, getSiteInventoryTotals } from "@/lib/site-inventory";
import { productPageMainClassName } from "@/lib/tool-ui";

export const runtime = "edge";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isAdminInventoryEnabled()) {
    return { title: "Not Found", robots: { index: false, follow: false } };
  }

  const t = await getTranslations({ locale, namespace: "AdminInventory" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
    alternates: { canonical: `/${locale}/admin/inventory` },
  };
}

export default async function AdminInventoryPage({ params }: Props) {
  if (!isAdminInventoryEnabled()) notFound();

  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("AdminInventory");
  const groups = buildSiteInventory();
  const totals = getSiteInventoryTotals(groups);
  const generatedAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <AppPageShell mainClassName={productPageMainClassName}>
      <ProductPageLayout
        title={t("title")}
        description={t("description", {
          items: totals.itemCount,
          categories: totals.categoryCount,
        })}
      >
        <SiteInventoryTable groups={groups} generatedAt={generatedAt} />
      </ProductPageLayout>
    </AppPageShell>
  );
}
