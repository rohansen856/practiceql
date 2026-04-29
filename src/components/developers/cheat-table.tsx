import type { CheatGroup } from "@/content/developers/cheatsheets";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/developers/copy-button";

interface CheatTableProps {
  group: CheatGroup;
}

export function CheatTable({ group }: CheatTableProps) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-baseline justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="font-mono text-sm font-semibold">{group.title}</h3>
          <p className="text-[11px] text-muted-foreground">{group.subtitle}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {group.rows.length} tricks
        </span>
      </div>
      <div className="divide-y">
        {group.rows.map((row) => (
          <div
            key={row.command}
            className="grid items-center gap-3 px-4 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <code className="truncate font-mono text-[12px]" title={row.command}>
              {row.command}
            </code>
            <span className="text-xs text-muted-foreground leading-relaxed">
              {row.description}
            </span>
            <CopyButton
              value={row.command}
              label="Copy command"
              iconOnly
              className="h-6 px-1.5 justify-self-end"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
