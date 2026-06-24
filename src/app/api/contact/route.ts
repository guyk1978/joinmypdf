import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/send-contact-email";
import { validateContactPayload } from "@/lib/submit-contact-form";

export const runtime = "edge";

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
  if (!process.env.RESEND_API_KEY?.trim()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as ContactBody;

    if (trimField(body.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const validated = validateContactPayload(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    await sendContactEmail(validated.data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[contact]", message);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
