import { ConnectionPayload } from "@/types/connection";
import { ColumnInfo, ForeignKeyInfo, QueryResult, TableInfo } from "@/types/sql";

export interface RemoteSchemaTable extends TableInfo {
  columns: ColumnInfo[];
  foreignKeys: ForeignKeyInfo[];
  rowCount: number;
}

export interface RemoteSchemaResponse {
  tables: RemoteSchemaTable[];
}

function baseRoute(kind: ConnectionPayload["kind"]): string {
  return kind === "postgresql" ? "/api/db/postgres" : "/api/db/mysql";
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json?.ok) {
    throw new Error(json?.error ?? `Request failed: ${res.status}`);
  }
  return json as T;
}

export async function testRemote(
  payload: ConnectionPayload,
): Promise<{ version: string }> {
  const res = await postJson<{ ok: true; version: string }>(
    `${baseRoute(payload.kind)}/test`,
    payload,
  );
  return { version: res.version };
}

export async function executeRemote(
  payload: ConnectionPayload,
  sql: string,
): Promise<QueryResult[]> {
  const res = await postJson<{ ok: true; results: QueryResult[] }>(
    `${baseRoute(payload.kind)}/execute`,
    { connection: payload, sql },
  );
  return res.results;
}

export async function fetchRemoteSchema(
  payload: ConnectionPayload,
): Promise<RemoteSchemaResponse> {
  const res = await postJson<{ ok: true; schema: RemoteSchemaResponse }>(
    `${baseRoute(payload.kind)}/schema`,
    { connection: payload },
  );
  return res.schema;
}
