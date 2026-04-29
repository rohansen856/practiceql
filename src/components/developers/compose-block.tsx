"use client";

import { Download, FileCode2, KeyRound, TerminalSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/developers/copy-button";
import { downloadTextFile } from "@/lib/export/text-file";
import type { ComposeRecipe } from "@/content/developers/compose";

interface ComposeBlockProps {
  recipe: ComposeRecipe;
}

export function ComposeBlock({ recipe }: ComposeBlockProps) {
  const handleDownload = () => {
    try {
      downloadTextFile(
        recipe.filename,
        recipe.content,
        "text/yaml;charset=utf-8",
      );
      toast.success(`Downloaded ${recipe.filename}`);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-start gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <FileCode2 className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{recipe.title}</h3>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {recipe.filename}
              </code>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {recipe.description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <CopyButton value={recipe.content} label="Copy YAML" variant="outline" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      <pre className="max-h-96 overflow-auto bg-muted/40 px-4 py-3 font-mono text-[12px] leading-relaxed">
        <code>{recipe.content}</code>
      </pre>

      <Separator />

      <div className="grid gap-4 px-4 py-3 md:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            Credentials
          </div>
          <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 text-xs">
            {recipe.credentials.map((c) => (
              <div
                key={c.label}
                className="contents [&_dt]:text-muted-foreground [&_dd]:min-w-0"
              >
                <dt>{c.label}</dt>
                <dd className="truncate font-mono text-[11px]" title={c.value}>
                  {c.value}
                </dd>
                <CopyButton
                  value={c.value}
                  label={`Copy ${c.label}`}
                  iconOnly
                  className="h-6 px-1.5"
                />
              </div>
            ))}
          </dl>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <TerminalSquare className="h-3.5 w-3.5" />
            Quick start
          </div>
          <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-2">
            <code className="flex-1 font-mono text-[11px] leading-relaxed break-all">
              {recipe.cli}
            </code>
            <CopyButton
              value={recipe.cli}
              label="Copy command"
              iconOnly
              className="h-6 px-1.5"
            />
          </div>
          <div className="flex items-start gap-2 rounded-md border border-dashed bg-background p-2">
            <code className="flex-1 font-mono text-[11px] leading-relaxed break-all">
              {recipe.connectionUrl}
            </code>
            <CopyButton
              value={recipe.connectionUrl}
              label="Copy URL"
              iconOnly
              className="h-6 px-1.5"
            />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Paste the URL into Settings &rarr; Connections to point PracticeQL
            at your local DB.
          </p>
        </section>
      </div>
    </Card>
  );
}
