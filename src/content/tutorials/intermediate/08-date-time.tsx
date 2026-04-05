"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Clock, Calendar, CalendarDays, Timer } from "lucide-react";

const SEED = `
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  title TEXT,
  event_ts TEXT  -- ISO-8601 string: '2024-03-15 14:30:00'
);
INSERT INTO events VALUES (1, 'Launch',        '2024-01-15 09:00:00');
INSERT INTO events VALUES (2, 'Design review', '2024-02-05 14:30:00');
INSERT INTO events VALUES (3, 'Retro',         '2024-02-28 17:15:00');
INSERT INTO events VALUES (4, 'Q2 kickoff',    '2024-04-02 10:00:00');
INSERT INTO events VALUES (5, 'All-hands',     '2024-06-10 16:00:00');
INSERT INTO events VALUES (6, 'Demo day',      '2024-09-22 13:45:00');
`;

export default function DateTime() {
  return (
    <article className="prose-custom">
      <h1>Dates, Times, and Intervals</h1>

      <p>
        SQLite doesn&apos;t have a dedicated <code>DATE</code> or{" "}
        <code>DATETIME</code> type. Instead, it stores dates as{" "}
        <strong>ISO-8601 text</strong> (<code>YYYY-MM-DD HH:MM:SS</code>) and
        gives you a family of functions to manipulate them. This tutorial
        covers the practical patterns you&apos;ll use 90% of the time.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: Calendar, label: "date()", note: "YYYY-MM-DD" },
          { icon: Clock, label: "time()", note: "HH:MM:SS" },
          { icon: CalendarDays, label: "datetime()", note: "Full timestamp" },
          { icon: Timer, label: "strftime()", note: "Custom format" },
        ].map(({ icon: Icon, label, note }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
          >
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-mono text-[11px] truncate">{label}</p>
              <p className="text-muted-foreground text-[10px]">{note}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Current date &amp; time</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT
  date('now')                     AS today,
  time('now')                     AS now_utc,
  datetime('now')                 AS stamp_utc,
  datetime('now', 'localtime')    AS stamp_local;`}
        title="NOW functions"
      />

      <h2>Date arithmetic with modifiers</h2>
      <p>
        Every date function takes <strong>modifiers</strong>:{" "}
        <code>&apos;+N days&apos;</code>, <code>&apos;-1 month&apos;</code>,{" "}
        <code>&apos;start of month&apos;</code>, and so on. Chain as many as you
        need.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT
  date('now')                                     AS today,
  date('now', '+7 days')                          AS one_week_later,
  date('now', '-1 month')                         AS one_month_ago,
  date('now', 'start of month')                   AS this_month_start,
  date('now', 'start of month', '+1 month', '-1 day') AS end_of_month;`}
        title="Modifiers"
      />

      <h2>Extracting parts with strftime()</h2>
      <p>
        <code>strftime(&apos;format&apos;, date)</code> formats any component.
        Common placeholders: <code>%Y</code> (year), <code>%m</code> (month),{" "}
        <code>%d</code> (day), <code>%H</code> (hour), <code>%w</code>{" "}
        (weekday: 0=Sunday).
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT
  title,
  event_ts,
  strftime('%Y',    event_ts)  AS year,
  strftime('%m',    event_ts)  AS month,
  strftime('%Y-%m', event_ts)  AS year_month,
  strftime('%w',    event_ts)  AS weekday_num,
  CASE strftime('%w', event_ts)
    WHEN '0' THEN 'Sun' WHEN '1' THEN 'Mon' WHEN '2' THEN 'Tue'
    WHEN '3' THEN 'Wed' WHEN '4' THEN 'Thu' WHEN '5' THEN 'Fri'
    WHEN '6' THEN 'Sat'
  END AS weekday
FROM events
ORDER BY event_ts;`}
        title="Extracting date parts"
      />

      <h2>Grouping by month or year</h2>
      <p>
        A very common pattern: count events per month.{" "}
        <code>strftime(&apos;%Y-%m&apos;, ...)</code> gives you a clean{" "}
        <code>YYYY-MM</code> bucket.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT
  strftime('%Y-%m', event_ts) AS month,
  COUNT(*)                    AS events
FROM events
GROUP BY month
ORDER BY month;`}
        title="Events per month"
      />

      <h2>Filtering by date ranges</h2>
      <p>
        Because ISO-8601 sorts lexicographically the same way it sorts
        chronologically, you can use plain string comparisons.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT title, event_ts
FROM events
WHERE event_ts >= '2024-02-01'
  AND event_ts <  '2024-05-01'
ORDER BY event_ts;`}
        title="BETWEEN two dates"
      />

      <h2>Age and duration</h2>
      <p>
        <code>julianday()</code> converts a date to a continuous number.
        Subtracting two julian days gives you the difference in{" "}
        <strong>days (as a decimal)</strong>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT
  title,
  event_ts,
  ROUND(julianday('now') - julianday(event_ts), 1) AS days_ago
FROM events
ORDER BY event_ts DESC;`}
        title="How many days ago"
      />

      <h2>Unix timestamps</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT
  datetime(1710000000, 'unixepoch')  AS from_unix,
  strftime('%s', '2024-03-15')       AS to_unix;`}
        title="Unix epoch conversions"
      />

      <h2>Dialect notes</h2>
      <ul>
        <li>
          <strong>PostgreSQL</strong> uses <code>date_trunc</code> and{" "}
          <code>EXTRACT(YEAR FROM ts)</code> instead of <code>strftime</code>.
        </li>
        <li>
          <strong>MySQL</strong> uses <code>DATE_FORMAT()</code> and{" "}
          <code>DATE_ADD()</code>.
        </li>
        <li>
          Store timestamps in <strong>UTC</strong>. Convert to the user&apos;s
          timezone only at display time.
        </li>
      </ul>
    </article>
  );
}
