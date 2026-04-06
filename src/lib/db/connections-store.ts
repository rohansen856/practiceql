import { openDB, DBSchema, IDBPDatabase } from "idb";
import { StoredConnection, VaultRecord } from "@/types/connection";

interface ConnectionsDB extends DBSchema {
  vault: {
    key: "vault";
    value: VaultRecord;
  };
  connections: {
    key: string;
    value: StoredConnection;
    indexes: { "by-kind": string; "by-name": string };
  };
}

let dbPromise: Promise<IDBPDatabase<ConnectionsDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ConnectionsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ConnectionsDB>("practiceql-connections", 1, {
      upgrade(db) {
        db.createObjectStore("vault", { keyPath: "id" });
        const conns = db.createObjectStore("connections", { keyPath: "id" });
        conns.createIndex("by-kind", "kind");
        conns.createIndex("by-name", "name");
      },
    });
  }
  return dbPromise;
}

export async function loadVault(): Promise<VaultRecord | undefined> {
  const db = await getDB();
  return db.get("vault", "vault");
}

export async function saveVault(record: VaultRecord): Promise<void> {
  const db = await getDB();
  await db.put("vault", record);
}

export async function resetVault(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["vault", "connections"], "readwrite");
  await tx.objectStore("vault").clear();
  await tx.objectStore("connections").clear();
  await tx.done;
}

export async function listConnections(): Promise<StoredConnection[]> {
  const db = await getDB();
  const all = await db.getAll("connections");
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getConnection(
  id: string,
): Promise<StoredConnection | undefined> {
  const db = await getDB();
  return db.get("connections", id);
}

export async function upsertConnection(record: StoredConnection): Promise<void> {
  const db = await getDB();
  await db.put("connections", record);
}

export async function deleteConnection(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("connections", id);
}
