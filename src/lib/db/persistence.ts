import { openDB, DBSchema, IDBPDatabase } from "idb";
import { ChallengeProgress } from "@/types/challenge";
import { TutorialProgress } from "@/types/tutorial";

interface PracticeQLDB extends DBSchema {
  databases: {
    key: string;
    value: {
      name: string;
      data: Uint8Array;
      updatedAt: number;
    };
  };
  progress: {
    key: string;
    value: ChallengeProgress | TutorialProgress;
  };
  queries: {
    key: number;
    value: {
      sql: string;
      dbName: string;
      timestamp: number;
    };
    indexes: { "by-db": string; "by-timestamp": number };
  };
}

let dbPromise: Promise<IDBPDatabase<PracticeQLDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PracticeQLDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PracticeQLDB>("practiceql", 1, {
      upgrade(db) {
        db.createObjectStore("databases", { keyPath: "name" });
        db.createObjectStore("progress", { keyPath: "challengeId" });
        const queryStore = db.createObjectStore("queries", {
          autoIncrement: true,
        });
        queryStore.createIndex("by-db", "dbName");
        queryStore.createIndex("by-timestamp", "timestamp");
      },
    });
  }
  return dbPromise;
}

export async function saveDatabase(
  name: string,
  data: Uint8Array
): Promise<void> {
  const db = await getDB();
  await db.put("databases", { name, data, updatedAt: Date.now() });
}

export async function loadDatabase(
  name: string
): Promise<Uint8Array | undefined> {
  const db = await getDB();
  const record = await db.get("databases", name);
  return record?.data;
}

export async function deleteDatabase(name: string): Promise<void> {
  const db = await getDB();
  await db.delete("databases", name);
}

export async function listDatabases(): Promise<string[]> {
  const db = await getDB();
  const all = await db.getAll("databases");
  return all.map((r) => r.name);
}

export async function saveChallengeProgress(
  progress: ChallengeProgress
): Promise<void> {
  const db = await getDB();
  await db.put("progress", progress);
}

export async function getChallengeProgress(
  challengeId: string
): Promise<ChallengeProgress | undefined> {
  const db = await getDB();
  return (await db.get("progress", challengeId)) as
    | ChallengeProgress
    | undefined;
}

export async function getAllChallengeProgress(): Promise<ChallengeProgress[]> {
  const db = await getDB();
  const all = await db.getAll("progress");
  return all.filter(
    (p) => "challengeId" in p && "attempts" in p
  ) as ChallengeProgress[];
}

export async function saveTutorialProgress(
  progress: TutorialProgress
): Promise<void> {
  const db = await getDB();
  await db.put("progress", { ...progress, challengeId: `tutorial:${progress.slug}` } as unknown as TutorialProgress);
}

export async function getTutorialProgress(
  slug: string
): Promise<TutorialProgress | undefined> {
  const db = await getDB();
  const record = await db.get("progress", `tutorial:${slug}`);
  return record as TutorialProgress | undefined;
}

export async function saveQuery(
  sql: string,
  dbName: string
): Promise<void> {
  const db = await getDB();
  await db.add("queries", { sql, dbName, timestamp: Date.now() });
}

export async function getQueryHistory(
  dbName?: string,
  limit = 50
): Promise<{ sql: string; dbName: string; timestamp: number }[]> {
  const db = await getDB();
  const all = dbName
    ? await db.getAllFromIndex("queries", "by-db", dbName)
    : await db.getAll("queries");
  return all
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear("databases");
  await db.clear("progress");
  await db.clear("queries");
}

export async function exportAllData(): Promise<{
  databases: { name: string; data: number[] }[];
  progress: (ChallengeProgress | TutorialProgress)[];
  queries: { sql: string; dbName: string; timestamp: number }[];
}> {
  const db = await getDB();
  const databases = await db.getAll("databases");
  const progress = await db.getAll("progress");
  const queries = await db.getAll("queries");

  return {
    databases: databases.map((d) => ({
      name: d.name,
      data: Array.from(d.data),
    })),
    progress,
    queries,
  };
}

export async function importAllData(data: {
  databases: { name: string; data: number[] }[];
  progress: (ChallengeProgress | TutorialProgress)[];
  queries: { sql: string; dbName: string; timestamp: number }[];
}): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["databases", "progress", "queries"], "readwrite");

  for (const d of data.databases) {
    await tx.objectStore("databases").put({
      name: d.name,
      data: new Uint8Array(d.data),
      updatedAt: Date.now(),
    });
  }
  for (const p of data.progress) {
    await tx.objectStore("progress").put(p);
  }
  for (const q of data.queries) {
    await tx.objectStore("queries").add(q);
  }
  await tx.done;
}
