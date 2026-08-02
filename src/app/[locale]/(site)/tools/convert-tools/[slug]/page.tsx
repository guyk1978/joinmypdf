import { listHubToolStaticParams } from "@/lib/create-hub-tool-page";

export { default, generateMetadata } from "../../[slug]/page";

export function generateStaticParams() {
  return listHubToolStaticParams("convert");
}
