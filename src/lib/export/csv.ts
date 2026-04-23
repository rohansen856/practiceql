/**
 * Minimal CSV serialization + browser download helpers for query results.
 *
 * We intentionally do not pull in a library: the format we emit is RFC 4180
 * compatible (CRLF line endings, double-quote wrapping, escaped embedded
 * quotes). Binary cells (Uint8Array) are rendered as `0x…` hex literals so
 * they round-trip as valid SQL blob literals rather than garbled text.
 */

export type CsvCell = string | number | bigint | boolean | null | Uint8Array;

function needsQuoting(value: string): boolean {
  return /[",\r\n]/.test(value);
}

function escapeCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Uint8Array) {
    let hex = "0x";
    for (const b of cell) hex += b.toString(16).padStart(2, "0");
    return hex;
  }
  const str = String(cell);
  if (!needsQuoting(str)) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv(columns: string[], rows: CsvCell[][]): string {
  const header = columns.map((c) => escapeCell(c)).join(",");
  const body = rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
  return body ? `${header}\r\n${body}\r\n` : `${header}\r\n`;
}

/**
 * Triggers a client-side download of the given CSV content. Prefixes the blob
 * with a UTF-8 BOM so Excel opens non-ASCII characters correctly.
 */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
