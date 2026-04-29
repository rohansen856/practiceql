/**
 * Catalog of free-tier database hosting providers. Data is editorial - the
 * specifics (storage, limits) are what the vendors advertised at the time of
 * writing and will drift; include the source link so readers can verify.
 */

export type ProviderTier = "free" | "credits" | "always-free";

export interface Provider {
  id: string;
  name: string;
  headline: string;
  description: string;
  bestFor: string;
  freeTier: string;
  highlight: string;
  tier: ProviderTier;
  url: string;
  // Tailwind color tokens for the accent treatment
  accent: {
    bg: string;
    ring: string;
    text: string;
  };
}

const ACCENTS = {
  emerald: {
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  sky: {
    bg: "bg-sky-500/10",
    ring: "ring-sky-500/20",
    text: "text-sky-600 dark:text-sky-400",
  },
  violet: {
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
  },
  fuchsia: {
    bg: "bg-fuchsia-500/10",
    ring: "ring-fuchsia-500/20",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
  },
};

export const POSTGRES_PROVIDERS: Provider[] = [
  {
    id: "supabase",
    name: "Supabase",
    headline: "Firebase, but SQL-first",
    description:
      "Postgres plus auth, storage, realtime, and auto-generated APIs. The easiest way to go from zero to full-stack on Postgres.",
    bestFor: "MVPs, SaaS, hackathons",
    freeTier: "~500 MB DB storage, 50 k auth users, 1 GB file storage",
    highlight: "Auth + auto APIs bundled",
    tier: "free",
    url: "https://supabase.com/pricing",
    accent: ACCENTS.emerald,
  },
  {
    id: "neon",
    name: "Neon",
    headline: "Serverless Postgres with branching",
    description:
      "True serverless Postgres that scales to zero when idle. Database branching works like git - spin a branch per PR, preview, then discard.",
    bestFor: "Modern apps, dev previews",
    freeTier: "Up to 10 projects · ~0.5–10 GB per branch depending on plan",
    highlight: "DB branching + scale-to-zero",
    tier: "free",
    url: "https://neon.tech/pricing",
    accent: ACCENTS.sky,
  },
  {
    id: "render",
    name: "Render",
    headline: "Managed Postgres, zero fuss",
    description:
      "Simple managed Postgres that plugs into Render's web services. Click once, copy the connection string, done.",
    bestFor: "Quick deploys, prototypes",
    freeTier: "~1 GB storage · limited CPU/RAM · expires after 90 days",
    highlight: "Easiest setup of the bunch",
    tier: "free",
    url: "https://render.com/pricing#databases",
    accent: ACCENTS.violet,
  },
  {
    id: "aiven",
    name: "Aiven",
    headline: "Production-like managed Postgres",
    description:
      "Run Postgres on the major clouds with proper observability, backups, and VPC peering. The free plan is small but has no time limit.",
    bestFor: "Testing production-grade infra",
    freeTier: "1 CPU · 1 GB RAM · 5 GB storage · no time limit",
    highlight: "No trial expiry - rare",
    tier: "always-free",
    url: "https://aiven.io/pricing",
    accent: ACCENTS.amber,
  },
  {
    id: "fly",
    name: "Fly.io",
    headline: "Postgres close to your users",
    description:
      "Deploy Postgres in any of Fly's global regions via a CLI. Good when you need low-latency reads in multiple geographies.",
    bestFor: "Geo-distributed apps",
    freeTier: "~3 GB volume · shared-cpu-1x · multi-region replicas",
    highlight: "Edge-deployed Postgres",
    tier: "credits",
    url: "https://fly.io/docs/postgres/",
    accent: ACCENTS.rose,
  },
];

export const MYSQL_PROVIDERS: Provider[] = [
  {
    id: "planetscale",
    name: "PlanetScale",
    headline: "MySQL on Vitess - YouTube-scale",
    description:
      "Serverless MySQL built on Vitess. Non-blocking schema changes, branch-and-merge DDL, no connection-count limits.",
    bestFor: "Production SaaS",
    freeTier: "Hobby plan: 5 GB storage, 1 B row reads/mo (subject to change)",
    highlight: "Branching DDL + horizontal scale",
    tier: "free",
    url: "https://planetscale.com/pricing",
    accent: ACCENTS.emerald,
  },
  {
    id: "railway",
    name: "Railway",
    headline: "Spin up MySQL in one click",
    description:
      "Developer-friendly PaaS. Monthly usage credits cover a small MySQL instance plus your service.",
    bestFor: "Hackathons, side projects",
    freeTier: "Trial credits (~$5) refresh monthly on Hobby plan",
    highlight: "Fastest from zero to URL",
    tier: "credits",
    url: "https://railway.app/pricing",
    accent: ACCENTS.sky,
  },
  {
    id: "render-mysql",
    name: "Render (via service)",
    headline: "MySQL as a background service",
    description:
      "Render doesn't offer managed MySQL directly, but the Docker service plan makes it trivial to host MySQL yourself with a persistent disk.",
    bestFor: "Simple self-hosted MySQL",
    freeTier: "Free web services · paid disks for persistence",
    highlight: "Pair with docker-compose below",
    tier: "free",
    url: "https://render.com/docs/deploy-an-image",
    accent: ACCENTS.violet,
  },
  {
    id: "oracle-cloud",
    name: "Oracle Cloud (HeatWave)",
    headline: "Always-free Arm VMs + MySQL HeatWave",
    description:
      "Oracle's always-free tier is the most generous compute out there (4 cores, 24 GB RAM on Arm). Run a managed MySQL HeatWave instance or host your own.",
    bestFor: "Serious hobby projects",
    freeTier: "4 Arm vCPUs · 24 GB RAM · 200 GB block storage · always free",
    highlight: "Real compute for $0",
    tier: "always-free",
    url: "https://www.oracle.com/cloud/free/",
    accent: ACCENTS.amber,
  },
  {
    id: "freesqldatabase",
    name: "FreeSQLDatabase",
    headline: "Throwaway MySQL in 30 seconds",
    description:
      "No-signup-friction shared MySQL. Tiny storage and not for production, but perfect when a tutorial or college assignment just needs a DB URL.",
    bestFor: "Learning, tutorials",
    freeTier: "Tiny DB (~5 MB) · shared · no production guarantees",
    highlight: "Zero setup",
    tier: "free",
    url: "https://www.freesqldatabase.com/",
    accent: ACCENTS.rose,
  },
];
