"use client";

import { useDBStore } from "@/stores/db-store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { TableIcon, KeyRound, Type } from "lucide-react";

export function TableBrowser() {
  const tables = useDBStore((s) => s.tables);
  const schemas = useDBStore((s) => s.schemas);

  if (tables.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <TableIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No tables yet</p>
        <p className="text-xs mt-1">Create a table to get started</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
        Tables ({tables.length})
      </h3>
      <Accordion multiple className="w-full">
        {tables.map((table) => (
          <AccordionItem key={table.name} value={table.name} className="border-none">
            <AccordionTrigger className="py-1.5 px-2 text-sm hover:no-underline hover:bg-muted/50 rounded-md">
              <span className="flex items-center gap-2">
                <TableIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {table.name}
                {table.type === "view" && (
                  <Badge variant="outline" className="text-[10px] h-4">
                    view
                  </Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-1">
              <div className="pl-6 space-y-0.5">
                {(schemas[table.name] ?? []).map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center gap-2 text-xs py-0.5 text-muted-foreground"
                  >
                    {col.primaryKey ? (
                      <KeyRound className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <Type className="h-3 w-3" />
                    )}
                    <span className="font-mono">{col.name}</span>
                    <span className="text-[10px] opacity-60">{col.type || "ANY"}</span>
                    {col.notNull && (
                      <span className="text-[10px] opacity-40">NOT NULL</span>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
