import { NextRequest, NextResponse } from "next/server";
import { isValidationError, validatePayload } from "@/lib/db/remote/validate";
import { pgExecute } from "@/lib/db/remote/postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = validatePayload(body?.connection);
    if (isValidationError(payload)) {
      return NextResponse.json(
        { ok: false, error: payload.message },
        { status: 400 },
      );
    }
    if (payload.kind !== "postgresql") {
      return NextResponse.json(
        { ok: false, error: "Wrong engine for this route" },
        { status: 400 },
      );
    }
    const sql = typeof body?.sql === "string" ? body.sql : "";
    if (!sql.trim()) {
      return NextResponse.json(
        { ok: false, error: "SQL is empty" },
        { status: 400 },
      );
    }
    const results = await pgExecute(payload, sql);
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
