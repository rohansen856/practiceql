"use client";

import Link from "next/link";
import {
  Terminal,
  BookOpen,
  Trophy,
  Database,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Play,
  CheckCircle2,
  Code2,
  Layers,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Terminal,
    title: "SQL Playground",
    description:
      "Write and execute SQL queries instantly. Full SQLite engine running in your browser with syntax highlighting and autocomplete.",
    href: "/playground",
    tint: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
  },
  {
    icon: BookOpen,
    title: "Guided Tutorials",
    description:
      "Learn SQL from absolute beginner to expert. Visual diagrams, interactive examples, and step-by-step explanations.",
    href: "/tutorials",
    tint: "text-sky-600 dark:text-sky-400 bg-sky-500/10 ring-sky-500/20",
  },
  {
    icon: Trophy,
    title: "Challenges",
    description:
      "Test your skills with 30+ challenges across WHERE, JOINs, aggregation, subqueries, window functions, and more.",
    href: "/challenges",
    tint: "text-amber-600 dark:text-amber-400 bg-amber-500/10 ring-amber-500/20",
  },
  {
    icon: Database,
    title: "Schema Builder",
    description:
      "Create your own tables, define columns and constraints, insert data, and experiment with your own database designs.",
    href: "/schema-builder",
    tint: "text-violet-600 dark:text-violet-400 bg-violet-500/10 ring-violet-500/20",
  },
];

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: "Runs in Your Browser",
    description: "No backend, no signup, no installations. SQLite runs via WebAssembly right in your browser tab.",
  },
  {
    icon: Shield,
    title: "Your Data Stays Local",
    description: "All databases are stored in IndexedDB. Nothing leaves your machine. Ever.",
  },
  {
    icon: Globe,
    title: "Works Offline",
    description: "Once loaded, everything works without an internet connection. Learn SQL anywhere.",
  },
];

const STEPS = [
  {
    step: 1,
    icon: Code2,
    title: "Write SQL",
    description: "Type your query in the editor with full syntax highlighting and smart autocomplete.",
  },
  {
    step: 2,
    icon: Play,
    title: "Execute Instantly",
    description: "Hit Ctrl+Enter and see results in milliseconds. No waiting for remote servers.",
  },
  {
    step: 3,
    icon: BrainCircuit,
    title: "Learn & Iterate",
    description: "Read explanations, view diagrams, and refine your queries until you master each concept.",
  },
];

const LEVELS = [
  {
    label: "Beginner",
    count: 6,
    color:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25",
  },
  {
    label: "Intermediate",
    count: 5,
    color: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/25",
  },
  {
    label: "Advanced",
    count: 4,
    color:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25",
  },
  {
    label: "Expert",
    count: 3,
    color: "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/25",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--emerald-500)/0.12,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
        />
        <div className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center max-w-3xl mx-auto">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-normal border-primary/20">
            <Zap className="h-3 w-3 text-primary" />
            100% browser-based - no backend required
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Master SQL by{" "}
            <span className="text-primary underline decoration-primary/30 decoration-4 underline-offset-[6px]">
              DOing
            </span>
          </h1>

          <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Interactive tutorials, hands-on challenges, and a full SQL playground -
            all running locally in your browser. No signup. No setup. Just SQL.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="gap-2">
              <Link href="/playground">
                <Terminal className="h-4 w-4" />
                Open Playground
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/tutorials">
                <BookOpen className="h-4 w-4" />
                Start Learning
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-5 pt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              No signup
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Works offline
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Data stays local
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-center mb-2">
            How It Works
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-10">
            From zero to running queries in seconds.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="relative flex flex-col items-center text-center gap-3 p-5 rounded-xl border bg-background/60"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold absolute -top-5">
                  {s.step}
                </div>
                <s.icon className="h-6 w-6 text-primary mt-4" />
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight text-center mb-2">
            Everything You Need
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-10 max-w-md mx-auto">
            Four tools that work together to take you from SQL-curious to SQL-confident.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <Link key={f.href} href={f.href} className="group">
                <Card className="h-full transition-all group-hover:border-primary/40 group-hover:shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${f.tint}`}
                      >
                        <f.icon className="h-4.5 w-4.5" />
                      </div>
                      <CardTitle className="text-base">{f.title}</CardTitle>
                      <ArrowRight className="h-4 w-4 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    </div>
                    <CardDescription className="leading-relaxed">
                      {f.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-3">Structured Learning Path</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
            From your first SELECT to advanced window functions - a guided curriculum with {18} tutorials and {30}+ challenges.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {LEVELS.map((l) => (
              <div
                key={l.label}
                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${l.color}`}
              >
                <Layers className="h-4 w-4" />
                {l.label}
                <span className="opacity-70">({l.count} tutorials)</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8 md:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{h.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{h.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-muted/30">
        <div className="max-w-xl mx-auto text-center">
          <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-3">Ready to start?</h2>
          <p className="text-muted-foreground mb-6">
            Jump into the playground and start writing SQL right now. No account needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/playground">
                <Terminal className="h-4 w-4" />
                Open Playground
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/challenges">
                <Trophy className="h-4 w-4" />
                Try a Challenge
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t text-center text-xs text-muted-foreground">
        PracticeQL - Learn SQL in your browser. Built with Next.js, sql.js, and CodeMirror.
      </footer>
    </div>
  );
}
