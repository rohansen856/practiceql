"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Info,
  Link2,
  Loader2,
  PlugZap,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ConnectionDraft,
  ConnectionKind,
  ConnectionMeta,
  DEFAULT_PORTS,
  KIND_LABELS,
} from "@/types/connection";
import { testRemote } from "@/lib/db/remote-engine";
import { parseConnectionUrl } from "@/lib/db/parse-connection-url";
import { useConnectionStore } from "@/stores/connection-store";

interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: ConnectionMeta | null;
}

const EMPTY: ConnectionDraft = {
  name: "",
  kind: "postgresql",
  host: "localhost",
  port: DEFAULT_PORTS.postgresql,
  database: "",
  username: "",
  password: "",
  ssl: false,
};

type TestState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ok"; version: string }
  | { status: "error"; message: string };

export function ConnectionDialog({
  open,
  onOpenChange,
  editing,
}: ConnectionDialogProps) {
  const saveProfile = useConnectionStore((s) => s.saveProfile);
  const [draft, setDraft] = useState<ConnectionDraft>(EMPTY);
  const [test, setTest] = useState<TestState>({ status: "idle" });
  const [saving, setSaving] = useState(false);
  const [connUrl, setConnUrl] = useState("");
  const [urlParse, setUrlParse] = useState<
    | { status: "idle" }
    | { status: "ok"; warnings: string[] }
    | { status: "error"; message: string }
  >({ status: "idle" });

  useEffect(() => {
    if (open) {
      setTest({ status: "idle" });
      setConnUrl("");
      setUrlParse({ status: "idle" });
      if (editing) {
        setDraft({
          id: editing.id,
          name: editing.name,
          kind: editing.kind,
          host: editing.host,
          port: editing.port,
          database: editing.database,
          username: editing.username,
          password: "",
          ssl: editing.ssl,
        });
      } else {
        setDraft(EMPTY);
      }
    }
  }, [open, editing]);

  const update = <K extends keyof ConnectionDraft>(
    key: K,
    value: ConnectionDraft[K],
  ) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "kind" && typeof value === "string") {
        const k = value as ConnectionKind;
        if (prev.port === DEFAULT_PORTS[prev.kind]) {
          next.port = DEFAULT_PORTS[k];
        }
      }
      return next;
    });
    setTest({ status: "idle" });
  };

  const onParseUrl = () => {
    const res = parseConnectionUrl(connUrl);
    if (!res.ok) {
      setUrlParse({ status: "error", message: res.error });
      return;
    }
    setDraft((prev) => ({ ...prev, ...res.value.patch }));
    setUrlParse({ status: "ok", warnings: res.value.warnings });
    setTest({ status: "idle" });
    toast.success("Connection URL applied");
  };

  const onTest = async () => {
    if (!draft.host.trim() || !draft.database.trim()) {
      toast.error("host and database are required");
      return;
    }
    if (!editing && !draft.password) {
      toast.error("password is required");
      return;
    }
    setTest({ status: "running" });
    try {
      const result = await testRemote({
        kind: draft.kind,
        host: draft.host,
        port: draft.port,
        database: draft.database,
        username: draft.username,
        password: draft.password,
        ssl: draft.ssl,
      });
      setTest({ status: "ok", version: result.version });
    } catch (e) {
      setTest({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!editing && !draft.password) {
      toast.error("Password is required for new connections");
      return;
    }
    setSaving(true);
    try {
      await saveProfile(draft);
      toast.success(editing ? "Connection updated" : "Connection saved");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit connection" : "New database connection"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update connection details. Leave the password blank to keep it unchanged."
              : "Save credentials for a remote database. They are encrypted in IndexedDB with your vault passphrase."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5 rounded-md border border-dashed bg-muted/30 p-3">
            <Label
              htmlFor="conn-url"
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              Paste a connection URL (optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="conn-url"
                placeholder="postgresql://user:pass@host:5432/db?sslmode=require"
                value={connUrl}
                onChange={(e) => {
                  setConnUrl(e.target.value);
                  if (urlParse.status !== "idle") {
                    setUrlParse({ status: "idle" });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onParseUrl();
                  }
                }}
                className="font-mono text-xs"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onParseUrl}
                disabled={!connUrl.trim()}
              >
                Parse
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Fills in host, port, database, credentials and SSL. Supports{" "}
              <code className="font-mono">postgresql://</code>,{" "}
              <code className="font-mono">postgres://</code>,{" "}
              <code className="font-mono">mysql://</code>, and{" "}
              <code className="font-mono">mariadb://</code>.
            </p>
            {urlParse.status === "ok" && (
              <Alert variant="success" className="mt-1">
                <CheckCircle2 />
                <AlertTitle>URL parsed</AlertTitle>
                <AlertDescription>
                  {urlParse.warnings.length > 0 ? (
                    <span>
                      Applied host, port, database, credentials and SSL.
                      Ignored unmapped params:{" "}
                      <span className="font-mono">
                        {urlParse.warnings.join(", ")}
                      </span>
                      .
                    </span>
                  ) : (
                    "All fields applied to the form below."
                  )}
                </AlertDescription>
              </Alert>
            )}
            {urlParse.status === "error" && (
              <Alert variant="destructive" className="mt-1">
                <XCircle />
                <AlertTitle>Invalid URL</AlertTitle>
                <AlertDescription className="break-all">
                  {urlParse.message}
                </AlertDescription>
              </Alert>
            )}
            {editing && urlParse.status === "idle" && (
              <p className="flex items-start gap-1 text-[11px] text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Editing an existing connection - pasting a URL will overwrite
                the fields below (except the name).
              </p>
            )}
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="conn-name">Name</Label>
              <Input
                id="conn-name"
                placeholder="Production read replica"
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conn-kind">Engine</Label>
              <Select
                value={draft.kind}
                onValueChange={(v) =>
                  update("kind", (v ?? "postgresql") as ConnectionKind)
                }
              >
                <SelectTrigger id="conn-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">
                    {KIND_LABELS.postgresql}
                  </SelectItem>
                  <SelectItem value="mysql">{KIND_LABELS.mysql}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-[3fr_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="conn-host">Host</Label>
              <Input
                id="conn-host"
                placeholder="localhost"
                value={draft.host}
                onChange={(e) => update("host", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conn-port">Port</Label>
              <Input
                id="conn-port"
                type="number"
                min={1}
                max={65535}
                value={draft.port}
                onChange={(e) => update("port", Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="conn-db">Database</Label>
            <Input
              id="conn-db"
              placeholder={draft.kind === "postgresql" ? "postgres" : "myapp"}
              value={draft.database}
              onChange={(e) => update("database", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="conn-user">Username</Label>
              <Input
                id="conn-user"
                autoComplete="username"
                value={draft.username}
                onChange={(e) => update("username", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conn-pass">
                Password{" "}
                {editing && (
                  <span className="text-xs text-muted-foreground">
                    (leave blank to keep)
                  </span>
                )}
              </Label>
              <Input
                id="conn-pass"
                type="password"
                autoComplete="new-password"
                value={draft.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Switch
              checked={draft.ssl}
              onCheckedChange={(c) => update("ssl", c)}
            />
            <span>Require SSL</span>
          </label>

          {test.status === "ok" && (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertTitle>Connected</AlertTitle>
              <AlertDescription className="font-mono text-xs break-all">
                {test.version}
              </AlertDescription>
            </Alert>
          )}
          {test.status === "error" && (
            <Alert variant="destructive">
              <XCircle />
              <AlertTitle>Connection failed</AlertTitle>
              <AlertDescription className="break-all">
                {test.message}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onTest}
              disabled={test.status === "running" || saving}
              className="gap-1.5"
            >
              {test.status === "running" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlugZap className="h-3.5 w-3.5" />
              )}
              Test connection
            </Button>
            <Button type="submit" disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editing ? "Save changes" : "Save connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
