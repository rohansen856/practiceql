/**
 * Generic browser-side text file download helper.
 *
 * Kept separate from the CSV helper so it doesn't inherit its quirks
 * (BOM, CRLF newlines). Consumers decide their own MIME type and extension.
 */

export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8",
): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
