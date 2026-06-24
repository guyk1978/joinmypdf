export const CONTACT_EMAIL_TO =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL_TO ?? "dgartists@gmail.com";

export type ContactFormPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactSubmitErrorCode =
  | "name_required"
  | "email_invalid"
  | "subject_required"
  | "message_required"
  | "send_failed"
  | "activation_required";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALIDATION_ERRORS = new Set<ContactSubmitErrorCode>([
  "name_required",
  "email_invalid",
  "subject_required",
  "message_required",
]);

function trimField(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateContactPayload(raw: {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
}): { ok: true; data: ContactFormPayload } | { ok: false; error: ContactSubmitErrorCode } {
  const name = trimField(raw.name, 120);
  const email = trimField(raw.email, 254);
  const subject = trimField(raw.subject, 200);
  const message = trimField(raw.message, 5000);

  if (!name) return { ok: false, error: "name_required" };
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "email_invalid" };
  if (!subject) return { ok: false, error: "subject_required" };
  if (!message) return { ok: false, error: "message_required" };

  return { ok: true, data: { name, email, subject, message } };
}

function isFormSubmitSuccess(data: unknown, responseOk: boolean): boolean {
  if (!data || typeof data !== "object") return responseOk;
  const success = (data as { success?: unknown }).success;
  return success !== false && success !== "false";
}

/** FormSubmit must run in the browser — server-side calls time out or fail. */
export async function submitContactViaFormSubmit(payload: ContactFormPayload): Promise<void> {
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_EMAIL_TO)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      message: `Subject: ${payload.subject}\n\n${payload.message}`,
      _subject: `[JoinMyPDF] ${payload.subject}`,
      _replyto: payload.email,
      _template: "table",
      _captcha: "false",
    }),
  });

  const data = (await response.json().catch(() => null)) as { success?: string; message?: string } | null;

  if (!isFormSubmitSuccess(data, response.ok)) {
    const hint = data?.message?.toLowerCase() ?? "";
    if (hint.includes("activation")) {
      throw new Error("activation_required");
    }
    throw new Error("send_failed");
  }
}

export async function submitContactForm(payload: ContactFormPayload): Promise<void> {
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) return;

    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (response.status === 400 && body.error && VALIDATION_ERRORS.has(body.error as ContactSubmitErrorCode)) {
      throw new Error(body.error);
    }
  } catch (error) {
    if (error instanceof Error && VALIDATION_ERRORS.has(error.message as ContactSubmitErrorCode)) {
      throw error;
    }
  }

  await submitContactViaFormSubmit(payload);
}

export function isContactValidationError(message: string): message is ContactSubmitErrorCode {
  return VALIDATION_ERRORS.has(message as ContactSubmitErrorCode);
}
