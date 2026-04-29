import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/developers/copy-button";
import type { ConnectionSample } from "@/content/developers/cheatsheets";

interface ConnectionSampleCardProps {
  sample: ConnectionSample;
}

export function ConnectionSampleCard({ sample }: ConnectionSampleCardProps) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{sample.title}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {sample.language}
          </span>
        </div>
        <CopyButton
          value={sample.snippet}
          label={`Copy ${sample.title}`}
          iconOnly
          className="h-6 px-1.5"
        />
      </div>
      <pre className="max-h-56 overflow-auto bg-muted/30 px-3 py-2 font-mono text-[11.5px] leading-relaxed">
        <code>{sample.snippet}</code>
      </pre>
    </Card>
  );
}
