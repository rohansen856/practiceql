type Row = (string | number | null)[];

function normalizeValue(v: string | number | null | Uint8Array): string | number | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Uint8Array) return "[BLOB]";
  if (typeof v === "number") return v;
  return String(v);
}

function rowToString(row: Row): string {
  return row.map((v) => (v === null ? "NULL" : String(v))).join("|");
}

export interface ComparisonResult {
  correct: boolean;
  message: string;
  details?: string;
}

export function compareResults(
  actual: { columns: string[]; values: (string | number | null | Uint8Array)[][] },
  expected: { columns: string[]; values: Row[] },
  orderMatters: boolean
): ComparisonResult {
  // Check columns
  const actualCols = actual.columns.map((c) => c.toLowerCase());
  const expectedCols = expected.columns.map((c) => c.toLowerCase());

  if (actualCols.length !== expectedCols.length) {
    return {
      correct: false,
      message: "Wrong number of columns",
      details: `Expected ${expectedCols.length} columns (${expectedCols.join(", ")}), got ${actualCols.length} (${actualCols.join(", ")})`,
    };
  }

  for (let i = 0; i < expectedCols.length; i++) {
    if (actualCols[i] !== expectedCols[i]) {
      return {
        correct: false,
        message: "Column names don't match",
        details: `Expected column "${expectedCols[i]}" at position ${i + 1}, got "${actualCols[i]}"`,
      };
    }
  }

  // Normalize values
  const actualRows: Row[] = actual.values.map((row) =>
    row.map(normalizeValue)
  );
  const expectedRows = expected.values;

  // Check row count
  if (actualRows.length !== expectedRows.length) {
    return {
      correct: false,
      message: "Wrong number of rows",
      details: `Expected ${expectedRows.length} rows, got ${actualRows.length}`,
    };
  }

  if (orderMatters) {
    for (let i = 0; i < expectedRows.length; i++) {
      const actualStr = rowToString(actualRows[i]);
      const expectedStr = rowToString(expectedRows[i]);
      if (actualStr !== expectedStr) {
        return {
          correct: false,
          message: `Row ${i + 1} doesn't match`,
          details: `Expected: ${expectedStr}\nGot: ${actualStr}`,
        };
      }
    }
  } else {
    const actualSet = new Set(actualRows.map(rowToString));
    const expectedSet = new Set(expectedRows.map(rowToString));

    for (const row of expectedSet) {
      if (!actualSet.has(row)) {
        return {
          correct: false,
          message: "Missing expected row",
          details: `Expected row not found: ${row}`,
        };
      }
    }

    for (const row of actualSet) {
      if (!expectedSet.has(row)) {
        return {
          correct: false,
          message: "Extra unexpected row",
          details: `Unexpected row found: ${row}`,
        };
      }
    }
  }

  return { correct: true, message: "Correct! All rows match." };
}
