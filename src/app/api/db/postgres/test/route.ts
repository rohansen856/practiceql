import { NextRequest, NextResponse } from "next/server";
import { isValidationError, validatePayload } from "@/lib/db/remote/validate";
import { pgTest } from "@/lib/db/remote/postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = validatePayload(body);
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
    const version = await pgTest(payload);
    return NextResponse.json({ ok: true, version });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
