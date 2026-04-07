"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Database,
  Pencil,
  Plug,
  PlugZap,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConnectionStore } from "@/stores/connection-store";
import { ConnectionDialog } from "./connection-dialog";
import { ConnectionMeta, KIND_LABELS } from "@/types/connection";

const KIND_ACCENT: Record<string, { dot: string; tint: string }> = {
  postgresql: {
    dot: "bg-sky-500",
    tint: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  mysql: {
    dot: "bg-amber-500",
    tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
};

export function ConnectionsList() {
  const profiles = useConnectionStore((s) => s.profiles);
  const profilesLoaded = useConnectionStore((s) => s.profilesLoaded);
  const refreshProfiles = useConnectionStore((s) => s.refreshProfiles);
  const deleteProfile = useConnectionStore((s) => s.deleteProfile);
  const activeId = useConnectionStore((s) => s.activeId);
  const setActive = useConnectionStore((s) => s.setActive);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ConnectionMeta | null>(null);

  useEffect(() => {
    if (!profilesLoaded) refreshProfiles();
  }, [profilesLoaded, refreshProfiles]);

  const onAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const onEdit = (meta: ConnectionMeta) => {
    setEditing(meta);
    setDialogOpen(true);
  };

  const onDelete = async (meta: ConnectionMeta) => {
    if (!window.confirm(`Delete connection "${meta.name}"?`)) return;
    try {
      await deleteProfile(meta.id);
      toast.success("Connection deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const onUse = (meta: ConnectionMeta) => {
    setActive(meta.id);
    toast.success(`Now using ${meta.name}`);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          SQLite is always available in your browser. Adding a connection
          enables that engine in the switcher.
        </p>
        <Button size="sm" onClick={onAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New connection
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <Database className="h-5 w-5 mx-auto mb-2 text-muted-foreground/70" />
          No remote connections yet. Add MySQL or PostgreSQL credentials to
          enable those engines.
        </div>
      ) : (
        <ul className="space-y-2">
          {profiles.map((p) => {
            const accent = KIND_ACCENT[p.kind];
            const isActive = activeId === p.id;
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg border p-3 bg-card"
              >
                <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{p.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${accent.tint}`}>
                      {KIND_LABELS[p.kind]}
                    </Badge>
                    {isActive && (
                      <Badge className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/30">
                        <PlugZap className="h-3 w-3" />
                        active
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {p.username ? `${p.username}@` : ""}
                    {p.host}:{p.port}/{p.database}
                    {p.ssl ? " · ssl" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant={isActive ? "secondary" : "outline"}
                    onClick={() => onUse(p)}
                    className="gap-1.5"
                    disabled={isActive}
                  >
                    <Plug className="h-3.5 w-3.5" />
                    {isActive ? "Active" : "Use"}
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => onEdit(p)}
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => onDelete(p)}
                    aria-label={`Delete ${p.name}`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </>
  );
}
