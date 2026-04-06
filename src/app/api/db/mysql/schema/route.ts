import { NextRequest, NextResponse } from "next/server";
import { isValidationError, validatePayload } from "@/lib/db/remote/validate";
import { mysqlSchema } from "@/lib/db/remote/mysql";

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
    if (payload.kind !== "mysql") {
      return NextResponse.json(
        { ok: false, error: "Wrong engine for this route" },
        { status: 400 },
      );
    }
    const schema = await mysqlSchema(payload);
    return NextResponse.json({ ok: true, schema });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
