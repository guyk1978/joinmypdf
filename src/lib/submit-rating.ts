import type { ImpactScoreKey } from "@/lib/rating-config";
import { getEmailJsConfig, getFeedbackEmailTo } from "@/lib/emailjs-config";
import { buildEmailJsTemplateContext } from "@/lib/emailjs-template-vars";

export type RatingPayload = {
  impactKey: ImpactScoreKey;
  impactLabel: string;
  pageUrl: string;
  pageTitle: string;
  fileContext?: string;
};

export type RatingSubmitError = "not_configured" | "send_failed";

export async function submitRating(payload: RatingPayload): Promise<void> {
  const config = getEmailJsConfig();
  if (!config) throw new Error("not_configured");

  const { timestampIso, date, url, tool_name } = buildEmailJsTemplateContext(
    payload.pageUrl,
    payload.pageTitle,
  );

  const subject = `Impact rating on ${tool_name}`;
  const fileLine = payload.fileContext ? ` | File: ${payload.fileContext}` : "";
  const message = `Utility Impact: ${payload.impactLabel} | Date: ${date} | Tool Page: ${url}${fileLine}`;

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
      feedback_category: "Rating",
      feedback_type: payload.impactLabel,
      feedback_reason: payload.impactLabel,
      impact_score: payload.impactKey,
      file_context: payload.fileContext ?? "",
      timestamp: timestampIso,
      to_email: getFeedbackEmailTo(),
      tool_name,
      url,
      date,
    },
    { publicKey: config.publicKey },
  );
}

export function isRatingSubmitError(message: string): message is RatingSubmitError {
  return message === "not_configured" || message === "send_failed";
}
