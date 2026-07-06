import type { FeedbackType } from "@/lib/feedback-config";

export type FeedbackPayload = {
  type: FeedbackType;
  reasonLabel: string;
  pageUrl: string;
  pageTitle: string;
  pageType: "tool" | "article";
  fileContext?: string;
};

export type FeedbackSubmitError = "not_configured" | "send_failed";

function getEmailJsConfig() {
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim();
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim();
  if (!publicKey || !serviceId || !templateId) return null;
  return { publicKey, serviceId, templateId };
}

export function isFeedbackEmailConfigured(): boolean {
  return getEmailJsConfig() !== null;
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const config = getEmailJsConfig();
  if (!config) throw new Error("not_configured");

  const timestamp = new Date().toISOString();
  const typeLabel = payload.type.charAt(0).toUpperCase() + payload.type.slice(1);
  const subject = `Feedback on ${payload.pageTitle || payload.pageUrl}`;
  const fileLine = payload.fileContext ? ` | File: ${payload.fileContext}` : "";
  const message = `User reported: ${typeLabel} — ${payload.reasonLabel} | Date: ${timestamp} | Tool Page: ${payload.pageUrl}${fileLine}`;

  const { default: emailjs } = await import("@emailjs/browser");

  await emailjs.send(
    config.serviceId,
    config.templateId,
    {
      subject,
      message,
      page_url: payload.pageUrl,
      page_title: payload.pageTitle,
      page_type: payload.pageType,
      feedback_type: typeLabel,
      feedback_reason: payload.reasonLabel,
      file_context: payload.fileContext ?? "",
      timestamp,
      to_email: process.env.NEXT_PUBLIC_FEEDBACK_EMAIL_TO ?? "dgartists@gmail.com",
    },
    { publicKey: config.publicKey },
  );
}

export function isFeedbackSubmitError(message: string): message is FeedbackSubmitError {
  return message === "not_configured" || message === "send_failed";
}
