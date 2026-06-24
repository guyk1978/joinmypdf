const CONTACT_TO = process.env.CONTACT_EMAIL_TO ?? "dgartists@gmail.com";
const CONTACT_FROM = process.env.CONTACT_EMAIL_FROM ?? "JoinMyPDF <onboarding@resend.dev>";

export type ContactEmailPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sendViaResend(payload: ContactEmailPayload, apiKey: string): Promise<void> {
  const { name, email, subject, message } = payload;
  const text = [`Name: ${name}`, `Email: ${email}`, "", message].join("\n");

  const html = `
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <hr />
    <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
  `.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      reply_to: email,
      subject: `[JoinMyPDF] ${subject}`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Resend API error (${response.status})`);
  }
}

async function sendViaFormSubmit(payload: ContactEmailPayload): Promise<void> {
  const { name, email, subject, message } = payload;

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_TO)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      message: `Subject: ${subject}\n\n${message}`,
      _subject: `[JoinMyPDF] ${subject}`,
      _replyto: email,
      _template: "table",
      _captcha: "false",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `FormSubmit error (${response.status})`);
  }

  const result = (await response.json().catch(() => null)) as { success?: string } | null;
  if (result && !result.success) {
    throw new Error("FormSubmit rejected the submission");
  }
}

export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey) {
    await sendViaResend(payload, apiKey);
    return;
  }

  await sendViaFormSubmit(payload);
}
