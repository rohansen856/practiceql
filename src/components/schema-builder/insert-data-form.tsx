"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableInfo, ColumnInfo } from "@/types/sql";
import { toast } from "sonner";
import { quoteIdent, type SqlDialect } from "@/lib/sql/dialect";

interface InsertDataFormProps {
  tables: TableInfo[];
  schemas: Record<string, ColumnInfo[]>;
  dialect?: SqlDialect;
  onExecute: (sql: string) => Promise<void>;
}

export function InsertDataForm({
  tables,
  schemas,
  dialect = "sqlite",
  onExecute,
}: InsertDataFormProps) {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [rowValues, setRowValues] = useState<Record<string, string>>({});
  const [bulkSQL, setBulkSQL] = useState("");
  const [inserting, setInserting] = useState(false);

  const columns = selectedTable ? schemas[selectedTable] ?? [] : [];

  const handleTableChange = (table: string | null) => {
    setSelectedTable(table ?? "");
    setRowValues({});
  };

  const handleInsertRow = async () => {
    if (!selectedTable || columns.length === 0) return;

    const cols = columns.filter((c) => rowValues[c.name]?.trim());
    if (cols.length === 0) {
      toast.error("Fill in at least one column value");
      return;
    }

    const colNames = cols.map((c) => quoteIdent(c.name, dialect)).join(", ");
    const values = cols
      .map((c) => {
        const val = rowValues[c.name].trim();
        if (val.toUpperCase() === "NULL") return "NULL";
        const isNumeric = !isNaN(Number(val)) && val !== "";
        return isNumeric ? val : `'${val.replace(/'/g, "''")}'`;
      })
      .join(", ");

    const sql = `INSERT INTO ${quoteIdent(selectedTable, dialect)} (${colNames}) VALUES (${values});`;
    setInserting(true);
    try {
      await onExecute(sql);
      toast.success("Row inserted");
      setRowValues({});
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setInserting(false);
    }
  };

  const handleBulkInsert = async () => {
    if (!bulkSQL.trim()) return;
    setInserting(true);
    try {
      await onExecute(bulkSQL);
      toast.success("SQL executed successfully");
      setBulkSQL("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setInserting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Table</Label>
        <Select value={selectedTable} onValueChange={handleTableChange}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Choose a table..." />
          </SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.name} value={t.name}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTable && (
        <Tabs defaultValue="form">
          <TabsList>
            <TabsTrigger value="form" className="text-xs">
              Row Form
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-xs">
              Bulk SQL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-3 mt-3">
            {columns.map((col) => (
              <div key={col.name} className="grid grid-cols-[140px_1fr] items-center gap-2">
                <Label className="text-xs font-mono truncate" title={col.name}>
                  {col.name}
                  <span className="text-muted-foreground ml-1">({col.type})</span>
                </Label>
                <Input
                  placeholder={col.notNull ? "required" : "optional (NULL)"}
                  value={rowValues[col.name] ?? ""}
                  onChange={(e) =>
                    setRowValues((prev) => ({ ...prev, [col.name]: e.target.value }))
                  }
                  className="font-mono text-sm h-8"
                />
              </div>
            ))}
            <Button onClick={handleInsertRow} disabled={inserting} size="sm">
              {inserting ? "Inserting..." : "Insert Row"}
            </Button>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-3 mt-3">
            <Textarea
              placeholder={`INSERT INTO ${selectedTable} (col1, col2) VALUES ('val1', 'val2');\nINSERT INTO ${selectedTable} ...`}
              value={bulkSQL}
              onChange={(e) => setBulkSQL(e.target.value)}
              className="font-mono text-sm min-h-[120px]"
            />
            <Button onClick={handleBulkInsert} disabled={inserting} size="sm">
              {inserting ? "Executing..." : "Execute SQL"}
            </Button>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
