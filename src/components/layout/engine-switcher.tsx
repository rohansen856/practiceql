"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ChevronDown,
  CircleCheck,
  Database,
  Loader2,
  Lock,
  Plug,
  Plus,
  ShieldOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useConnectionStore } from "@/stores/connection-store";
import { useDBStore } from "@/stores/db-store";
import { KIND_LABELS } from "@/types/connection";
import { cn } from "@/lib/utils";

const KIND_DOT: Record<string, string> = {
  postgresql: "bg-sky-500",
  mysql: "bg-amber-500",
};

export function EngineSwitcher() {
  const isEngineReady = useDBStore((s) => s.isEngineReady);
  const initVault = useConnectionStore((s) => s.initVault);
  const vaultStatus = useConnectionStore((s) => s.vaultStatus);
  const profiles = useConnectionStore((s) => s.profiles);
  const activeId = useConnectionStore((s) => s.activeId);
  const setActive = useConnectionStore((s) => s.setActive);

  useEffect(() => {
    initVault();
  }, [initVault]);

  const activeProfile = activeId
    ? profiles.find((p) => p.id === activeId) ?? null
    : null;

  const badgeLabel = activeProfile ? activeProfile.name : "SQLite";
  const badgeKind = activeProfile
    ? KIND_LABELS[activeProfile.kind]
    : "local";
  const badgeDot = activeProfile ? KIND_DOT[activeProfile.kind] : "bg-primary";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 font-normal"
          />
        }
      >
        <span className="flex items-center gap-1.5">
          {activeProfile ? (
            <span className={cn("h-1.5 w-1.5 rounded-full", badgeDot)} />
          ) : isEngineReady ? (
            <CircleCheck className="h-3 w-3 text-primary" />
          ) : (
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
          )}
          <span className="text-[11px]">{badgeLabel}</span>
          <Badge
            variant="outline"
            className="text-[9px] py-0 px-1 font-normal uppercase tracking-wide"
          >
            {badgeKind}
          </Badge>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-1">
        <div className="px-2 pt-1 pb-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Engine
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActive(null)}
          className={cn(
            "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent text-left",
            activeId === null && "bg-primary/10 text-primary",
          )}
        >
          <Database className="h-3.5 w-3.5 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">SQLite</div>
            <div className="text-[11px] text-muted-foreground">
              Browser-local sandbox
            </div>
          </div>
          {activeId === null && (
            <CircleCheck className="h-3.5 w-3.5 text-primary" />
          )}
        </button>

        {vaultStatus !== "unlocked" ? (
          <div className="mt-1 px-2 py-2 text-xs text-muted-foreground flex items-start gap-1.5 border-t pt-2">
            {vaultStatus === "locked" ? (
              <Lock className="h-3 w-3 mt-0.5 shrink-0" />
            ) : (
              <ShieldOff className="h-3 w-3 mt-0.5 shrink-0" />
            )}
            <span>
              {vaultStatus === "locked"
                ? "Vault is locked. Unlock it to use remote connections."
                : "No vault yet. Create one to store credentials."}
              <Link
                href="/settings#connections"
                className="block mt-1 text-primary hover:underline"
              >
                Go to Settings →
              </Link>
            </span>
          </div>
        ) : (
          <>
            {profiles.length === 0 ? (
              <div className="mt-1 px-2 py-2 text-xs text-muted-foreground border-t pt-2">
                No remote connections yet.
                <Link
                  href="/settings#connections"
                  className="block mt-1 text-primary hover:underline"
                >
                  Add MySQL / PostgreSQL →
                </Link>
              </div>
            ) : (
              <div className="border-t mt-1 pt-1">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActive(p.id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent text-left",
                      activeId === p.id && "bg-primary/10 text-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        KIND_DOT[p.kind],
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-1.5">
                        {p.name}
                        <Badge
                          variant="outline"
                          className="text-[9px] py-0 px-1 font-normal uppercase"
                        >
                          {KIND_LABELS[p.kind]}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        {p.host}:{p.port}/{p.database}
                      </div>
                    </div>
                    {activeId === p.id && (
                      <Plug className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="border-t mt-1 pt-1">
          <Link
            href="/settings#connections"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Manage connections
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
