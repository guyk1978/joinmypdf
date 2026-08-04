import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Legacy `/favicon-tools` → hub at `/tools/favicon-tools`. */
export default async function LegacyFaviconToolsRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/tools/favicon-tools`);
}
