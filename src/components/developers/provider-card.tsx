import { ArrowUpRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Provider } from "@/content/developers/providers";

const TIER_LABEL: Record<Provider["tier"], string> = {
  free: "Free tier",
  credits: "Monthly credits",
  "always-free": "Always free",
};

interface ProviderCardProps {
  provider: Provider;
  rank: number;
}

export function ProviderCard({ provider, rank }: ProviderCardProps) {
  return (
    <a
      href={provider.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group block focus-visible:outline-none"
    >
      <Card className="relative h-full overflow-hidden transition-all group-hover:border-primary/40 group-hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ring-1",
                provider.accent.bg,
                provider.accent.ring,
                provider.accent.text,
              )}
              aria-hidden
            >
              #{rank}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="truncate">{provider.name}</span>
                <ArrowUpRight
                  className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary"
                  aria-hidden
                />
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {provider.headline}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 text-[10px] font-normal uppercase tracking-wide"
            >
              {TIER_LABEL[provider.tier]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            {provider.description}
          </p>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Best for</dt>
            <dd>{provider.bestFor}</dd>
            <dt className="text-muted-foreground">Free tier</dt>
            <dd className="font-mono text-[11px]">{provider.freeTier}</dd>
          </dl>

          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1",
              provider.accent.bg,
              provider.accent.ring,
              provider.accent.text,
            )}
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            {provider.highlight}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
