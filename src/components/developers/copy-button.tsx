"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  /** Label announced to screen readers and used for the toast message. */
  label?: string;
  size?: "sm" | "default";
  variant?: "ghost" | "outline" | "secondary";
  className?: string;
  /** When true, only the icon is shown (no "Copy" text). */
  iconOnly?: boolean;
}

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
  variant = "ghost",
  className,
  iconOnly = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleCopy}
      title={label}
      aria-label={label}
      className={cn(
        "h-7 gap-1.5 text-xs",
        iconOnly ? "px-2" : "px-2.5",
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", copied && "text-emerald-500")} />
      {!iconOnly && (copied ? "Copied" : "Copy")}
    </Button>
  );
}
