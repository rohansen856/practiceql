import { ConnectionPayload } from "@/types/connection";

export interface ValidationError {
  message: string;
  field?: string;
}

export function validatePayload(payload: unknown): ConnectionPayload | ValidationError {
  if (!payload || typeof payload !== "object") {
    return { message: "Missing connection payload" };
  }
  const p = payload as Record<string, unknown>;
  const kind = p.kind;
  if (kind !== "postgresql" && kind !== "mysql") {
    return { message: "Unsupported engine", field: "kind" };
  }
  if (typeof p.host !== "string" || !p.host.trim()) {
    return { message: "host is required", field: "host" };
  }
  const port = Number(p.port);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    return { message: "Invalid port", field: "port" };
  }
  if (typeof p.database !== "string" || !p.database.trim()) {
    return { message: "database is required", field: "database" };
  }
  if (typeof p.username !== "string") {
    return { message: "username is required", field: "username" };
  }
  if (typeof p.password !== "string") {
    return { message: "password is required", field: "password" };
  }
  return {
    kind,
    host: p.host,
    port,
    database: p.database,
    username: p.username,
    password: p.password,
    ssl: Boolean(p.ssl),
  };
}

export function isValidationError(
  value: ConnectionPayload | ValidationError,
): value is ValidationError {
  return typeof (value as ValidationError).message === "string" &&
    !("kind" in value);
}
