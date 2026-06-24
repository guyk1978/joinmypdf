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

export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

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
