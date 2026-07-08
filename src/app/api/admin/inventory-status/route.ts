import { NextResponse } from "next/server";
import { isAdminInventoryEnabled } from "@/lib/admin-inventory";
import { getCanonicalToolSlugs } from "@/lib/canonical-tools";
import {
  setInventoryToolStatus,
  type InventoryToolStatus,
} from "@/lib/inventory-status";

export const runtime = "nodejs";

type StatusBody = {
  slug?: string;
  status?: InventoryToolStatus;
};

export async function POST(request: Request) {
  if (!isAdminInventoryEnabled()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as StatusBody;
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const status = body.status;

    if (!slug || (status !== "active" && status !== "inactive")) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const known = new Set(getCanonicalToolSlugs());
    if (!known.has(slug)) {
      return NextResponse.json({ error: "unknown_tool" }, { status: 404 });
    }

    const store = setInventoryToolStatus(slug, status);
    return NextResponse.json({
      ok: true,
      slug,
      status,
      updatedAt: store.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
