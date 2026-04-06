import { create } from "zustand";
import {
  ConnectionDraft,
  ConnectionMeta,
  ConnectionPayload,
  StoredConnection,
} from "@/types/connection";
import {
  deleteConnection as idbDelete,
  getConnection as idbGet,
  listConnections as idbList,
  loadVault,
  resetVault as idbResetVault,
  saveVault,
  upsertConnection,
} from "@/lib/db/connections-store";
import {
  createVaultKey,
  createVerifier,
  decrypt,
  encrypt,
  generateSalt,
  verifyPassphrase,
} from "@/lib/crypto/vault";

const ACTIVE_KEY = "practiceql.activeConnectionId";

function readActive(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function writeActive(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

function randomId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

function toMeta(conn: StoredConnection): ConnectionMeta {
  const { encryptedPassword: _, ...meta } = conn;
  void _;
  return meta;
}

export type VaultStatus = "uninitialized" | "locked" | "unlocked";

interface ConnectionState {
  vaultStatus: VaultStatus;
  vaultLoading: boolean;
  vaultError: string | null;
  vaultKey: CryptoKey | null;

  profiles: ConnectionMeta[];
  profilesLoaded: boolean;
  activeId: string | null;

  initVault: () => Promise<void>;
  setupVault: (passphrase: string) => Promise<void>;
  unlockVault: (passphrase: string) => Promise<boolean>;
  lockVault: () => void;
  resetVault: () => Promise<void>;

  refreshProfiles: () => Promise<void>;
  saveProfile: (draft: ConnectionDraft) => Promise<ConnectionMeta>;
  deleteProfile: (id: string) => Promise<void>;
  setActive: (id: string | null) => void;
  getPayload: (id: string) => Promise<ConnectionPayload>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  vaultStatus: "uninitialized",
  vaultLoading: true,
  vaultError: null,
  vaultKey: null,

  profiles: [],
  profilesLoaded: false,
  activeId: null,

  initVault: async () => {
    set({ vaultLoading: true, vaultError: null, activeId: readActive() });
    try {
      const vault = await loadVault();
      if (!vault) {
        set({ vaultStatus: "uninitialized", vaultLoading: false });
        return;
      }
      set({ vaultStatus: "locked", vaultLoading: false });
    } catch (e) {
      set({
        vaultStatus: "uninitialized",
        vaultError: e instanceof Error ? e.message : String(e),
        vaultLoading: false,
      });
    }
  },

  setupVault: async (passphrase: string) => {
    if (passphrase.length < 6) {
      throw new Error("Passphrase must be at least 6 characters");
    }
    const salt = await generateSalt();
    const key = await createVaultKey(passphrase, salt);
    const verifier = await createVerifier(key);
    await saveVault({
      id: "vault",
      salt,
      verifier,
      createdAt: Date.now(),
    });
    set({ vaultStatus: "unlocked", vaultKey: key, vaultError: null });
    await get().refreshProfiles();
  },

  unlockVault: async (passphrase: string) => {
    const vault = await loadVault();
    if (!vault) {
      set({ vaultStatus: "uninitialized" });
      return false;
    }
    try {
      const key = await createVaultKey(passphrase, vault.salt);
      const ok = await verifyPassphrase(key, vault.verifier);
      if (!ok) {
        set({ vaultError: "Incorrect passphrase" });
        return false;
      }
      set({ vaultStatus: "unlocked", vaultKey: key, vaultError: null });
      await get().refreshProfiles();
      return true;
    } catch (e) {
      set({ vaultError: e instanceof Error ? e.message : String(e) });
      return false;
    }
  },

  lockVault: () => {
    set({
      vaultStatus: "locked",
      vaultKey: null,
      profiles: [],
      profilesLoaded: false,
    });
    const active = get().activeId;
    if (active) {
      writeActive(null);
      set({ activeId: null });
    }
  },

  resetVault: async () => {
    await idbResetVault();
    writeActive(null);
    set({
      vaultStatus: "uninitialized",
      vaultKey: null,
      profiles: [],
      profilesLoaded: false,
      activeId: null,
      vaultError: null,
    });
  },

  refreshProfiles: async () => {
    try {
      const all = await idbList();
      set({
        profiles: all.map(toMeta),
        profilesLoaded: true,
      });
    } catch (e) {
      console.error("refreshProfiles failed", e);
      set({ profilesLoaded: true });
    }
  },

  saveProfile: async (draft: ConnectionDraft) => {
    const key = get().vaultKey;
    if (!key) throw new Error("Vault is locked");

    const id = draft.id ?? randomId();
    const now = Date.now();
    const existing = draft.id ? await idbGet(draft.id) : undefined;
    const encryptedPassword = draft.password
      ? await encrypt(key, draft.password)
      : existing?.encryptedPassword;

    if (!encryptedPassword) {
      throw new Error("Password is required for new connections");
    }

    const record: StoredConnection = {
      id,
      name: draft.name.trim(),
      kind: draft.kind,
      host: draft.host.trim(),
      port: draft.port,
      database: draft.database.trim(),
      username: draft.username.trim(),
      ssl: draft.ssl,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      encryptedPassword,
    };
    await upsertConnection(record);
    await get().refreshProfiles();
    return toMeta(record);
  },

  deleteProfile: async (id: string) => {
    await idbDelete(id);
    if (get().activeId === id) {
      writeActive(null);
      set({ activeId: null });
    }
    await get().refreshProfiles();
  },

  setActive: (id: string | null) => {
    writeActive(id);
    set({ activeId: id });
  },

  getPayload: async (id: string): Promise<ConnectionPayload> => {
    const key = get().vaultKey;
    if (!key) throw new Error("Vault is locked");
    const record = await idbGet(id);
    if (!record) throw new Error(`Connection "${id}" not found`);
    const password = await decrypt(key, record.encryptedPassword);
    return {
      kind: record.kind,
      host: record.host,
      port: record.port,
      database: record.database,
      username: record.username,
      password,
      ssl: record.ssl,
    };
  },
}));
