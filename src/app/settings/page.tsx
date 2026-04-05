"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  AlertTriangle,
  Database,
  Download,
  HardDriveDownload,
  Moon,
  Palette,
  RefreshCw,
  Settings as SettingsIcon,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  clearAllData,
  exportAllData,
  importAllData,
  listDatabases,
  deleteDatabase,
} from "@/lib/db/persistence";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ThemeChoice = "light" | "dark" | "system";

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Palette },
];

const PROGRESS_KEYS = [
  "practiceql.tutorials.progress",
  "practiceql.editor.preferences",
];

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [databases, setDatabases] = useState<string[]>([]);
  const [loadingDbs, setLoadingDbs] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refreshDatabases();
  }, [mounted]);

  const refreshDatabases = async () => {
    setLoadingDbs(true);
    try {
      const names = await listDatabases();
      setDatabases(names);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDbs(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `practiceql-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Export failed");
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importAllData(data);
        await refreshDatabases();
        toast.success("Backup restored");
      } catch (e) {
        console.error(e);
        toast.error("Import failed - invalid backup file");
      }
    };
    input.click();
  };

  const handleResetProgress = () => {
    if (!confirm("Reset all tutorial and challenge progress? This cannot be undone."))
      return;
    try {
      for (const k of PROGRESS_KEYS) {
        localStorage.removeItem(k);
      }
      toast.success("Progress cleared");
    } catch (e) {
      console.error(e);
      toast.error("Could not clear progress");
    }
  };

  const handleWipeAll = async () => {
    if (
      !confirm(
        "Wipe ALL local data - databases, progress, and query history? This cannot be undone."
      )
    )
      return;
    try {
      await clearAllData();
      for (const k of PROGRESS_KEYS) localStorage.removeItem(k);
      await refreshDatabases();
      toast.success("All data wiped");
    } catch (e) {
      console.error(e);
      toast.error("Wipe failed");
    }
  };

  const handleDeleteDB = async (name: string) => {
    if (!confirm(`Delete database "${name}"?`)) return;
    try {
      await deleteDatabase(name);
      await refreshDatabases();
      toast.success(`Deleted ${name}`);
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  const currentTheme = mounted ? (theme as ThemeChoice) ?? "system" : "system";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shrink-0">
          <SettingsIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
            Settings
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            Configure appearance, manage your local databases, and export or
            clear your data. Everything stays on your device.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-sky-500" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose how PracticeQL looks. The system option follows your OS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = currentTheme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "border-border hover:bg-muted hover:border-primary/20 text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
          {mounted && (
            <p className="text-xs text-muted-foreground mt-3">
              Currently rendering:{" "}
              <span className="font-mono">{resolvedTheme}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-violet-500" />
            Saved databases
          </CardTitle>
          <CardDescription>
            Databases created in the Schema Builder and Playground are stored
            locally in IndexedDB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDbs ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : databases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved databases yet. Create one from the Schema Builder.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {databases.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="font-mono text-sm">{name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDB(name)}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDriveDownload className="h-4 w-4 text-emerald-500" />
            Backup & restore
          </CardTitle>
          <CardDescription>
            Export your databases, progress, and query history to a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export backup
          </Button>
          <Button size="sm" variant="outline" onClick={handleImport} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Import backup
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger zone
          </CardTitle>
          <CardDescription>
            These actions permanently remove data from this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning">
            <AlertTriangle />
            <AlertTitle>Irreversible</AlertTitle>
            <AlertDescription>
              There is no undo for these actions. Export a backup first if you
              want to keep your work.
            </AlertDescription>
          </Alert>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium">Reset progress</p>
              <p className="text-xs text-muted-foreground">
                Clears tutorial completion and editor preferences. Databases are
                kept.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetProgress}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset progress
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium">Wipe everything</p>
              <p className="text-xs text-muted-foreground">
                Deletes all databases, progress, and query history.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleWipeAll}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Wipe all data
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 pt-4 pb-8 text-xs text-muted-foreground">
        <Badge variant="outline" className="font-normal">
          v0.1
        </Badge>
        <span>PracticeQL · runs locally in your browser</span>
      </div>
    </div>
  );
}
