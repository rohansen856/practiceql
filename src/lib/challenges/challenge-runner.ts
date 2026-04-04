import { SqliteEngine } from "@/lib/db/sql-engine";
import { Challenge } from "@/types/challenge";
import { compareResults, ComparisonResult } from "./output-comparator";

export interface ChallengeRunResult {
  comparison: ComparisonResult;
  actualColumns: string[];
  actualValues: (string | number | null | Uint8Array)[][];
  executionTimeMs: number;
  error?: string;
}

export async function runChallenge(
  challenge: Challenge,
  userSQL: string
): Promise<ChallengeRunResult> {
  const engine = await SqliteEngine.create();

  try {
    // Seed the database
    engine.exec(challenge.seedSQL);

    // Run user query
    const results = engine.exec(userSQL);

    if (results.length === 0 || results[results.length - 1].columns.length === 0) {
      return {
        comparison: {
          correct: false,
          message: "Your query didn't return any results",
          details: "Make sure your query is a SELECT statement that returns data.",
        },
        actualColumns: [],
        actualValues: [],
        executionTimeMs: results[0]?.executionTimeMs ?? 0,
      };
    }

    const lastResult = results[results.length - 1];

    const comparison = compareResults(
      { columns: lastResult.columns, values: lastResult.values },
      { columns: challenge.expectedColumns, values: challenge.expectedOutput },
      challenge.orderMatters
    );

    return {
      comparison,
      actualColumns: lastResult.columns,
      actualValues: lastResult.values,
      executionTimeMs: lastResult.executionTimeMs,
    };
  } catch (e: unknown) {
    const message =
      e && typeof e === "object" && "message" in e
        ? (e as { message: string }).message
        : String(e);
    return {
      comparison: { correct: false, message: "SQL Error" },
      actualColumns: [],
      actualValues: [],
      executionTimeMs: 0,
      error: message,
    };
  } finally {
    engine.close();
  }
}
