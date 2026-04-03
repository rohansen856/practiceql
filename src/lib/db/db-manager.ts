import { SqliteEngine } from "./sql-engine";
import { saveDatabase, loadDatabase } from "./persistence";
import { SQLEngine } from "@/types/engine";

const engines = new Map<string, SQLEngine>();

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(name: string, engine: SQLEngine) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const data = engine.serialize();
    saveDatabase(name, data);
  }, 500);
}

export async function getEngine(name: string): Promise<SQLEngine> {
  const existing = engines.get(name);
  if (existing) return existing;

  const data = await loadDatabase(name);
  const engine = await SqliteEngine.create(data);
  engines.set(name, engine);
  return engine;
}

export async function createEngine(
  name: string,
  seedSQL?: string
): Promise<SQLEngine> {
  closeEngine(name);

  const engine = await SqliteEngine.create();
  if (seedSQL) {
    engine.exec(seedSQL);
  }
  engines.set(name, engine);
  debouncedSave(name, engine);
  return engine;
}

export function execAndPersist(name: string, sql: string) {
  const engine = engines.get(name);
  if (!engine) throw new Error(`No engine found for "${name}"`);

  const results = engine.exec(sql);

  const mutationPattern = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)\b/i;
  if (mutationPattern.test(sql)) {
    debouncedSave(name, engine);
  }

  return results;
}

export function closeEngine(name: string) {
  const engine = engines.get(name);
  if (engine) {
    engine.close();
    engines.delete(name);
  }
}

export function closeAll() {
  for (const [name, engine] of engines) {
    engine.close();
    engines.delete(name);
  }
}

export function getLoadedEngine(name: string): SQLEngine | undefined {
  return engines.get(name);
}
