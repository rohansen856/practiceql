import {
  ConnectionDraft,
  ConnectionKind,
  DEFAULT_PORTS,
} from "@/types/connection";

export interface ParsedConnectionUrl {
  /** Fields to merge into a ConnectionDraft. `name` is never set. */
  patch: Partial<ConnectionDraft>;
  /** Query parameters we saw but did not map onto a field. */
  warnings: string[];
}

export type ParseConnectionResult =
  | { ok: true; value: ParsedConnectionUrl }
  | { ok: false; error: string };

const SCHEME_TO_KIND: Record<string, ConnectionKind> = {
  postgresql: "postgresql",
  postgres: "postgresql",
  pg: "postgresql",
  mysql: "mysql",
  mysql2: "mysql",
  mariadb: "mysql",
};

const MAPPED_PARAMS = new Set([
  "sslmode",
  "ssl",
  "useSSL",
  "usessl",
  "tls",
]);

/**
 * Tokens in `sslmode` that should toggle SSL on. `disable`/`false` turn it off.
 * See https://www.postgresql.org/docs/current/libpq-ssl.html.
 */
const SSL_ON = new Set([
  "require",
  "verify-ca",
  "verify-full",
  "prefer",
  "allow",
]);
const SSL_OFF = new Set(["disable", "false", "0", "off"]);

/**
 * Parse a database connection URL / DSN into fields for a `ConnectionDraft`.
 *
 * Supports the common `scheme://user:pass@host:port/database?params` form for
 * PostgreSQL (`postgresql://`, `postgres://`) and MySQL (`mysql://`,
 * `mariadb://`). Percent-encoded credentials are decoded. The `sslmode` /
 * `ssl` / `useSSL` query params control the `ssl` flag.
 *
 * The WHATWG `URL` parser rejects some unencoded password characters that
 * show up in real-world DSNs, so we fall back to a permissive regex when
 * that fails.
 */
export function parseConnectionUrl(input: string): ParseConnectionResult {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "URL is empty" };

  const schemeMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
  if (!schemeMatch) {
    return {
      ok: false,
      error:
        "Missing scheme. Expected a URL like postgresql://user:pass@host:5432/db.",
    };
  }
  const scheme = schemeMatch[1].toLowerCase();
  const kind = SCHEME_TO_KIND[scheme];
  if (!kind) {
    return {
      ok: false,
      error: `Unsupported scheme "${scheme}". Use postgresql://, postgres://, mysql://, or mariadb://.`,
    };
  }

  // WHATWG URL needs a scheme it recognises for full parsing. Normalise the
  // scheme so `host`, `port` etc. are exposed, then restore the original.
  const normalisedScheme = kind === "postgresql" ? "http" : "http";
  const toParse = raw.replace(/^[^:]+:\/\//, `${normalisedScheme}://`);

  let parsed: URL | null = null;
  try {
    parsed = new URL(toParse);
  } catch {
    // Fall through to regex fallback below.
  }

  let host = "";
  let port: number | null = null;
  let database = "";
  let username = "";
  let password = "";
  let search = "";

  if (parsed) {
    host = parsed.hostname;
    port = parsed.port ? Number(parsed.port) : null;
    database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    username = parsed.username ? decodeURIComponent(parsed.username) : "";
    password = parsed.password ? decodeURIComponent(parsed.password) : "";
    search = parsed.search;
  } else {
    // Permissive fallback: scheme://[user[:pass]@]host[:port][/db][?query]
    const re =
      /^[^:]+:\/\/(?:([^:@/?#]*)(?::([^@/?#]*))?@)?([^:/?#]+)(?::(\d+))?(?:\/([^?#]*))?(\?[^#]*)?/;
    const m = raw.match(re);
    if (!m) {
      return { ok: false, error: "Could not parse connection URL." };
    }
    username = m[1] ? decodeURIComponent(m[1]) : "";
    password = m[2] ? decodeURIComponent(m[2]) : "";
    host = m[3] ?? "";
    port = m[4] ? Number(m[4]) : null;
    database = m[5] ? decodeURIComponent(m[5]) : "";
    search = m[6] ?? "";
  }

  if (!host) {
    return { ok: false, error: "Missing host." };
  }
  if (port !== null && (!Number.isFinite(port) || port < 1 || port > 65535)) {
    return { ok: false, error: `Invalid port "${port}".` };
  }

  const params = new URLSearchParams(search);
  let ssl: boolean | undefined;

  const sslmode = params.get("sslmode") ?? params.get("ssl-mode");
  if (sslmode !== null) {
    const v = sslmode.toLowerCase();
    if (SSL_ON.has(v)) ssl = true;
    else if (SSL_OFF.has(v)) ssl = false;
    else {
      return {
        ok: false,
        error: `Unknown sslmode "${sslmode}". Expected one of: require, verify-ca, verify-full, prefer, allow, disable.`,
      };
    }
  }

  const sslParam =
    params.get("ssl") ?? params.get("useSSL") ?? params.get("tls");
  if (sslParam !== null) {
    const v = sslParam.toLowerCase();
    if (v === "true" || v === "1" || v === "on" || SSL_ON.has(v)) ssl = true;
    else if (SSL_OFF.has(v)) ssl = false;
  }

  const warnings: string[] = [];
  for (const key of params.keys()) {
    if (!MAPPED_PARAMS.has(key)) {
      warnings.push(key);
    }
  }

  const patch: Partial<ConnectionDraft> = {
    kind,
    host,
    port: port ?? DEFAULT_PORTS[kind],
    database,
    username,
    password,
  };
  if (ssl !== undefined) patch.ssl = ssl;

  return { ok: true, value: { patch, warnings } };
}
