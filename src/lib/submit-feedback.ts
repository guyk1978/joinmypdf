import type { FeedbackType } from "@/lib/feedback-config";
import { getEmailJsConfig, getFeedbackEmailTo } from "@/lib/emailjs-config";
import { buildEmailJsTemplateContext } from "@/lib/emailjs-template-vars";

export type FeedbackPayload = {
  type: FeedbackType;
  reasonLabel: string;
  pageUrl: string;
  pageTitle: string;
  pageType: "tool" | "article";
  fileContext?: string;
};

export type FeedbackSubmitError = "not_configured" | "send_failed";

export function isFeedbackEmailConfigured(): boolean {
  return getEmailJsConfig() !== null;
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const config = getEmailJsConfig();
  if (!config) throw new Error("not_configured");

  const { timestampIso, date, url, tool_name } = buildEmailJsTemplateContext(
    payload.pageUrl,
    payload.pageTitle,
  );

  const categoryLabel = payload.type.charAt(0).toUpperCase() + payload.type.slice(1);
  const subject = `Feedback on ${tool_name}`;
  const fileLine = payload.fileContext ? ` | File: ${payload.fileContext}` : "";
  const message = `User reported: ${payload.reasonLabel} (${categoryLabel}) | Date: ${date} | Tool Page: ${url}${fileLine}`;

  const { default: emailjs } = await import("@emailjs/browser");

  await emailjs.send(
    config.serviceId,
    config.templateId,
    {
      subject,
      message,
      // existing template vars
      page_url: payload.pageUrl,
      page_title: payload.pageTitle,
      page_type: payload.pageType,
      feedback_category: categoryLabel,
      feedback_type: payload.reasonLabel,
      feedback_reason: payload.reasonLabel,
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

export function isFeedbackSubmitError(message: string): message is FeedbackSubmitError {
  return message === "not_configured" || message === "send_failed";
}
