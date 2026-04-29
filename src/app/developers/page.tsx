"use client";

import {
  BookMarked,
  Boxes,
  Cloud,
  Container,
  GraduationCap,
  Layers,
  Lightbulb,
  Link2,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheatTable } from "@/components/developers/cheat-table";
import { ComposeBlock } from "@/components/developers/compose-block";
import { ConnectionSampleCard } from "@/components/developers/connection-sample-card";
import { ProviderCard } from "@/components/developers/provider-card";
import { COMPOSE_RECIPES } from "@/content/developers/compose";
import {
  CLI_CHEATS,
  CONNECTION_SAMPLES,
  PRODUCTION_TIPS,
  RESOURCES,
} from "@/content/developers/cheatsheets";
import {
  MYSQL_PROVIDERS,
  POSTGRES_PROVIDERS,
} from "@/content/developers/providers";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<
  "beginner" | "intermediate" | "advanced",
  string
> = {
  beginner:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25",
  intermediate:
    "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/25",
  advanced:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/25",
};

const SECTIONS = [
  { id: "providers", label: "Free providers", icon: Cloud },
  { id: "docker", label: "Docker recipes", icon: Container },
  { id: "cli", label: "CLI cheat sheets", icon: TerminalSquare },
  { id: "connections", label: "Connection snippets", icon: Link2 },
  { id: "production", label: "Prod tips", icon: ShieldCheck },
  { id: "learn", label: "Learning path", icon: GraduationCap },
];

const POSTGRES_RECIPES = COMPOSE_RECIPES.filter((r) => r.tag === "postgres");
const MYSQL_RECIPES = COMPOSE_RECIPES.filter((r) => r.tag === "mysql");
const FULLSTACK_RECIPES = COMPOSE_RECIPES.filter((r) => r.tag === "fullstack");

export default function DevelopersPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--primary)/0.12,transparent_70%)]"
        />
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-14">
          <Badge
            variant="secondary"
            className="w-fit gap-1.5 border-primary/20 px-3 py-1 text-xs font-normal"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            For developers, by developers
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Everything you need to run{" "}
            <span className="text-primary underline decoration-primary/30 decoration-4 underline-offset-[6px]">
              real databases
            </span>
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base leading-relaxed">
            A curated field guide: the best free database hosts, paste-ready
            Docker Compose stacks, cheat sheets, connection snippets, and the
            resources we actually send new hires to.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Providers */}
      <section
        id="providers"
        className="scroll-mt-16 px-6 py-14 border-b"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="01 · hosting"
            title="Free database providers"
            description="Five Postgres and five MySQL hosts with genuinely useful free tiers. Numbers drift - click through to the pricing page to verify before shipping."
          />

          <div className="mt-8 space-y-10">
            <ProviderSubsection
              title="PostgreSQL"
              subtitle="Relational, extensible, the default choice for most modern backends."
              providers={POSTGRES_PROVIDERS}
            />
            <ProviderSubsection
              title="MySQL"
              subtitle="Still the most deployed DB on earth. Pick these when your stack or team expects MySQL semantics."
              providers={MYSQL_PROVIDERS}
            />
          </div>
        </div>
      </section>

      {/* Docker */}
      <section
        id="docker"
        className="scroll-mt-16 bg-muted/20 px-6 py-14 border-b"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="02 · local dev"
            title="Docker Compose, copy-paste ready"
            description="Zero-config stacks for local hacking. Copy the YAML, drop it into a file, and run `docker compose up -d`. Credentials are intentionally weak - local use only."
          />

          <Tabs defaultValue="postgres" className="mt-8">
            <TabsList>
              <TabsTrigger value="postgres" className="gap-1.5 text-xs">
                <Boxes className="h-3.5 w-3.5" /> Postgres
              </TabsTrigger>
              <TabsTrigger value="mysql" className="gap-1.5 text-xs">
                <Boxes className="h-3.5 w-3.5" /> MySQL
              </TabsTrigger>
              <TabsTrigger value="fullstack" className="gap-1.5 text-xs">
                <Layers className="h-3.5 w-3.5" /> Full stack
              </TabsTrigger>
            </TabsList>

            <TabsContent value="postgres" className="mt-5 space-y-6">
              {POSTGRES_RECIPES.map((recipe) => (
                <ComposeBlock key={recipe.id} recipe={recipe} />
              ))}
            </TabsContent>
            <TabsContent value="mysql" className="mt-5 space-y-6">
              {MYSQL_RECIPES.map((recipe) => (
                <ComposeBlock key={recipe.id} recipe={recipe} />
              ))}
            </TabsContent>
            <TabsContent value="fullstack" className="mt-5 space-y-6">
              {FULLSTACK_RECIPES.map((recipe) => (
                <ComposeBlock key={recipe.id} recipe={recipe} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CLI */}
      <section
        id="cli"
        className="scroll-mt-16 px-6 py-14 border-b"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="03 · cli"
            title="Cheat sheets you'll forget you needed"
            description="The 80/20 of psql, the mysql client, and docker compose. Copy a command, paste it into your terminal."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {CLI_CHEATS.map((group) => (
              <CheatTable key={group.id} group={group} />
            ))}
          </div>
        </div>
      </section>

      {/* Connections */}
      <section
        id="connections"
        className="scroll-mt-16 bg-muted/20 px-6 py-14 border-b"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="04 · connect"
            title="Connection snippets"
            description="The same DB URL, used from the four languages you'll most likely be writing against it."
          />

          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CONNECTION_SAMPLES.map((s) => (
              <ConnectionSampleCard key={s.id} sample={s} />
            ))}
          </div>
        </div>
      </section>

      {/* Production tips */}
      <section
        id="production"
        className="scroll-mt-16 px-6 py-14 border-b"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="05 · production"
            title="Production-mindset checklist"
            description="Short, opinionated, dev-to-dev. None of these are strictly mandatory - all of them will save you a late-night page."
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTION_TIPS.map((tip) => (
              <Card key={tip.title} className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Lightbulb className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold">{tip.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tip.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Learning */}
      <section
        id="learn"
        className="scroll-mt-16 bg-muted/20 px-6 py-14 border-b"
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="06 · learn"
            title="From your first SELECT to query tuning"
            description="Free (or legendary-enough-to-buy) resources, grouped by where you are in the journey."
          />

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {RESOURCES.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group"
              >
                <Card className="h-full p-4 transition-all group-hover:border-primary/40 group-hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                      <BookMarked className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold group-hover:text-primary">
                          {r.title}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 capitalize",
                            LEVEL_STYLES[r.level],
                          )}
                        >
                          {r.level}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        Got a resource worth adding? PRs welcome - edit{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
          https://github.com/rohansen856/practiceql
        </code>
        .
      </footer>
    </div>
  );
}

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </span>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

interface ProviderSubsectionProps {
  title: string;
  subtitle: string;
  providers: typeof POSTGRES_PROVIDERS;
}

function ProviderSubsection({
  title,
  subtitle,
  providers,
}: ProviderSubsectionProps) {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-full border bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
          Top {providers.length}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p, idx) => (
          <ProviderCard key={p.id} provider={p} rank={idx + 1} />
        ))}
      </div>
    </div>
  );
}
