"use client";

import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-md m-2">
      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-destructive">SQL Error</p>
        <p className="text-sm text-destructive/80 font-mono mt-1">{message}</p>
      </div>
    </div>
  );
}
