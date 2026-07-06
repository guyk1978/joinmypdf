import type { ImpactScoreKey } from "@/lib/rating-config";

export type RatingPayload = {
  impactKey: ImpactScoreKey;
  impactLabel: string;
  pageUrl: string;
  pageTitle: string;
  fileContext?: string;
};

export type RatingSubmitError = "not_configured" | "send_failed";

function getEmailJsConfig() {
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim();
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim();
  if (!publicKey || !serviceId || !templateId) return null;
  return { publicKey, serviceId, templateId };
}

export async function submitRating(payload: RatingPayload): Promise<void> {
  const config = getEmailJsConfig();
  if (!config) throw new Error("not_configured");

  const timestamp = new Date().toISOString();
  const subject = `Impact rating on ${payload.pageTitle || payload.pageUrl}`;
  const fileLine = payload.fileContext ? ` | File: ${payload.fileContext}` : "";
  const message = `Utility Impact: ${payload.impactLabel} (${payload.impactKey}) | Date: ${timestamp} | Tool Page: ${payload.pageUrl}${fileLine}`;

  const { default: emailjs } = await import("@emailjs/browser");

  await emailjs.send(
    config.serviceId,
    config.templateId,
    {
      subject,
      message,
      page_url: payload.pageUrl,
      page_title: payload.pageTitle,
      page_type: "tool",
      feedback_type: "Rating",
      feedback_reason: payload.impactLabel,
      impact_score: payload.impactKey,
      file_context: payload.fileContext ?? "",
      timestamp,
      to_email: process.env.NEXT_PUBLIC_FEEDBACK_EMAIL_TO ?? "dgartists@gmail.com",
    },
    { publicKey: config.publicKey },
  );
}

export function isRatingSubmitError(message: string): message is RatingSubmitError {
  return message === "not_configured" || message === "send_failed";
}
