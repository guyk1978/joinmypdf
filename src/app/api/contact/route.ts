import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/send-contact-email";

export const runtime = "edge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactBody = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string;
};

function trimField(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactBody;

    if (trimField(body.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const name = trimField(body.name, 120);
    const email = trimField(body.email, 254);
    const subject = trimField(body.subject, 200);
    const message = trimField(body.message, 5000);

    if (!name) {
      return NextResponse.json({ error: "name_required" }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "email_invalid" }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: "subject_required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "message_required" }, { status: 400 });
    }

    await sendContactEmail({ name, email, subject, message });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[contact]", message);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
