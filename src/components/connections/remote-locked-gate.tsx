"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Lock, Settings as SettingsIcon, Unlock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConnectionStore } from "@/stores/connection-store";

/**
 * Shown by Playground / Schema Builder when a remote connection is the active
 * engine but the vault isn't unlocked. Offers inline passphrase entry when the
 * vault exists but is locked, and a fallback link to Settings when the vault
 * hasn't been created yet.
 */
export function RemoteLockedGate() {
  const status = useConnectionStore((s) => s.vaultStatus);
  const vaultError = useConnectionStore((s) => s.vaultError);
  const unlockVault = useConnectionStore((s) => s.unlockVault);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passphrase) return;
    setBusy(true);
    try {
      const ok = await unlockVault(passphrase);
      if (ok) {
        toast.success("Vault unlocked");
        setPassphrase("");
      }
    } finally {
      setBusy(false);
    }
  };

  if (status === "locked") {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Alert variant="info" className="max-w-md">
          <Lock />
          <AlertTitle>Vault is locked</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              A remote connection is active but your vault is locked. Enter your
              passphrase to unlock it for this session.
            </p>
            <form onSubmit={onSubmit} className="space-y-2">
              <Label htmlFor="gate-pass" className="sr-only">
                Passphrase
              </Label>
              <Input
                id="gate-pass"
                type="password"
                placeholder="Vault passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoComplete="current-password"
                autoFocus
                required
              />
              {vaultError && (
                <p className="text-xs text-destructive">{vaultError}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={busy || !passphrase}
                  className="gap-1.5"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  {busy ? "Unlocking..." : "Unlock"}
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href="/settings#connections">
                    <SettingsIcon className="h-3.5 w-3.5" />
                    Go to Settings
                  </Link>
                </Button>
              </div>
            </form>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Vault hasn't been created yet — no passphrase to enter, just send the
  // user to Settings to set one up.
  return (
    <div className="flex items-center justify-center h-full p-6">
      <Alert variant="warning" className="max-w-md">
        <Lock />
        <AlertTitle>Vault not set up</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            A remote connection is selected but the credential vault has not
            been created. Create a vault passphrase in Settings to unlock your
            saved connections.
          </p>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/settings#connections">
              <SettingsIcon className="h-3.5 w-3.5" />
              Go to Settings
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
