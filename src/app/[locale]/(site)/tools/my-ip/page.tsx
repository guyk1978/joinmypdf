import { redirect } from "@/i18n/navigation";
import { MY_IP_TOOL_PATH } from "@/lib/network-tools-hub";

type PageProps = { params: Promise<{ locale: string }> };

/** Flat slug redirect — canonical tool lives under the Network & API hub. */
export default async function MyIpFlatRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  redirect({ href: MY_IP_TOOL_PATH, locale });
}
