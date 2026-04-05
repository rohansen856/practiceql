export type ConnectionKind = "postgresql" | "mysql";

export interface ConnectionMeta {
  id: string;
  name: string;
  kind: ConnectionKind;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EncryptedBlob {
  iv: string;
  ciphertext: string;
}

export interface StoredConnection extends ConnectionMeta {
  encryptedPassword: EncryptedBlob;
}

export interface ConnectionDraft {
  id?: string;
  name: string;
  kind: ConnectionKind;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface ConnectionPayload {
  kind: ConnectionKind;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface VaultRecord {
  id: "vault";
  salt: string;
  verifier: EncryptedBlob;
  createdAt: number;
}

export const DEFAULT_PORTS: Record<ConnectionKind, number> = {
  postgresql: 5432,
  mysql: 3306,
};

export const KIND_LABELS: Record<ConnectionKind, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
};
