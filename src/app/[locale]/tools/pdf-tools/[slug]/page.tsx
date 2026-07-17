import { createHubToolStaticParams } from "@/lib/create-hub-tool-page";

export { default, generateMetadata } from "../../[slug]/page";
export const generateStaticParams = createHubToolStaticParams("pdf");
