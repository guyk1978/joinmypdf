import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Legacy top-level hub → nested under /tools/. */
export default async function LegacySecurityToolsRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/tools/security-tools`);
}
