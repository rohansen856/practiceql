"use client";

import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function TutorialPlaceholder() {
  return (
    <article className="prose-custom">
      <h1>Coming soon</h1>
      <p>
        This tutorial is being written. Meanwhile, you can jump into the
        playground or try a challenge on the same topic.
      </p>
      <Card className="not-prose mt-6 p-6 flex items-start gap-4 border-dashed">
        <Construction className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Help shape this content</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tutorials include interactive runnable SQL, diagrams, and
            progressive exercises. The schema and content for this lesson
            are still being authored - check back soon or start with the
            Beginner set.
          </p>
        </div>
      </Card>
    </article>
  );
}
