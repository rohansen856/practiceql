"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Lock, ShieldCheck, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useConnectionStore } from "@/stores/connection-store";

export function VaultPanel() {
  const status = useConnectionStore((s) => s.vaultStatus);
  const vaultError = useConnectionStore((s) => s.vaultError);
  const setupVault = useConnectionStore((s) => s.setupVault);
  const unlockVault = useConnectionStore((s) => s.unlockVault);
  const lockVault = useConnectionStore((s) => s.lockVault);
  const resetVault = useConnectionStore((s) => s.resetVault);

  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const onSetup = async (e: FormEvent) => {
    e.preventDefault();
    if (passphrase !== confirm) {
      toast.error("Passphrases do not match");
      return;
    }
    setBusy(true);
    try {
      await setupVault(passphrase);
      toast.success("Vault created");
      setPassphrase("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vault setup failed");
    } finally {
      setBusy(false);
    }
  };

  const onUnlock = async (e: FormEvent) => {
    e.preventDefault();
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

  const onReset = async () => {
    if (
      !window.confirm(
        "Reset the vault? This erases all saved connection profiles.",
      )
    ) {
      return;
    }
    await resetVault();
    toast.success("Vault reset");
  };

  if (status === "uninitialized") {
    return (
      <div className="space-y-4">
        <Alert variant="info">
          <ShieldCheck />
          <AlertTitle>Create a vault passphrase</AlertTitle>
          <AlertDescription>
            Your database passwords are encrypted client-side with AES-GCM and
            never stored in plaintext. The passphrase unlocks the vault for this
            browser session only.
          </AlertDescription>
        </Alert>
        <form onSubmit={onSetup} className="space-y-3 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="vault-pass">Passphrase</Label>
            <Input
              id="vault-pass"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vault-confirm">Confirm passphrase</Label>
            <Input
              id="vault-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            Create vault
          </Button>
        </form>
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="space-y-4">
        <Alert>
          <Lock />
          <AlertTitle>Vault locked</AlertTitle>
          <AlertDescription>
            Enter your passphrase to decrypt saved connection profiles.
          </AlertDescription>
        </Alert>
        <form onSubmit={onUnlock} className="space-y-3 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="vault-unlock">Passphrase</Label>
            <Input
              id="vault-unlock"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {vaultError && (
            <p className="text-xs text-destructive">{vaultError}</p>
          )}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={busy} className="gap-1.5">
              <Unlock className="h-3.5 w-3.5" />
              Unlock
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-destructive hover:text-destructive"
            >
              Forgot passphrase → reset
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="font-medium">Vault unlocked</span>
        <span className="text-muted-foreground text-xs">
          Session-only. Lock it when you&apos;re done.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          lockVault();
          toast.success("Vault locked");
        }}
        className="gap-1.5"
      >
        <Lock className="h-3.5 w-3.5" />
        Lock vault
      </Button>
    </div>
  );
}
