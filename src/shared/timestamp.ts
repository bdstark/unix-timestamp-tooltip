import type { ContextInfo } from "./context.js"; // .js required here due to Chrome implementing ESM spec strictly
import { toJq, toJs } from "./pathFormats.js"; // .js required here due to Chrome implementing ESM spec strictly
import { explainContext } from "./contextExplain.js"; // .js required here due to Chrome implementing ESM spec strictly
import { computeConfidence } from "./confidence.js"; // .js required here due to Chrome implementing ESM spec strictly
import { Settings } from "./settings.js"; // .js required here due to Chrome implementing ESM spec strictly

export type TooltipRow = {
  label: string;
  value: string;
  copy: string;
};

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export function isValidDate(date: Date): boolean {
  const year = date.getUTCFullYear();
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

export function formatDate(
  date: Date,
  timezone: "utc" | "local"
): string {
  if (timezone === "local") {
    return date.toLocaleString();
  }
  return date.toISOString().replace("T", " ").replace("Z", " UTC");
}

export function tooltipFor(
  value: number,
  settings: Settings,
  context: ContextInfo
): TooltipRow[] | null {
  const parsedDate = parseUnix(value);
  if (!parsedDate || !isValidDate(parsedDate)) {
    return null;
  }

  const rows: TooltipRow[] = [];

  // Why
  rows.push({
    label: "Why",
    value: explainContext(value, context),
    copy: explainContext(value, context),
  });

  // Confidence
  const confidence = computeConfidence(value, context, settings);
  rows.push({
    label: "Confidence",
    value: renderConfidence(confidence.percent),
    copy: `${confidence.percent}%`,
  });

  // Context
  rows.push({
    label: "Context",
    value: context.type.toUpperCase(),
    copy: context.type,
  });

  // Paths
  if (context.jsonPath) {
    rows.push({
      label: "JSON Path",
      value: context.jsonPath,
      copy: context.jsonPath,
    });

    rows.push({
      label: "jq",
      value: toJq(context.jsonPath),
      copy: toJq(context.jsonPath),
    });

    rows.push({
      label: "JS",
      value: toJs(context.jsonPath),
      copy: toJs(context.jsonPath),
    });
  }

  // Raw
  const s = String(Math.floor(parsedDate.getTime() / 1000));
  rows.push({
    label: "Unix (s)",
    value: s,
    copy: s,
  });

  const ms = String(parsedDate.getTime());
  rows.push({
    label: "Unix (ms)",
    value: ms,
    copy: ms,
  });



  if (settings.showHumanReadable) {
    const d = formatDate(parsedDate, "utc")
    rows.push({
      label: "DateTime (UTC)",
      value: d,
      copy: d,
    });

    const l = formatDate(parsedDate, "local")
    rows.push({
      label: "DateTime (Local)",
      value: l,
      copy: l,
    });

  }

  if (settings.showISO8601) {
    const d = parsedDate.toISOString()

    rows.push({
      label: "ISO8601",
      value: d,
      copy: d,
    });
  }


  if (settings.showRelative) {
    const d = relativeTime(parsedDate)
    rows.push({
      label: "Relative",
      value: d,
      copy: "", // Relative time is dynamic; don't copy
    });
  }

  return rows.length ? rows : null;
}

function parseUnix(value: number): Date | null {
  const len = value.toString().length;

  if (len === 10) {
    return new Date(value * 1000);
  }

  if (len === 13) {
    return new Date(value);
  }

  return null;
}

function renderConfidence(percent: number): string {
  const total = 10;
  const filled = Math.round((percent / 100) * total);
  return (
    "█".repeat(filled) +
    "░".repeat(total - filled) +
    ` ${percent}%`
  );
}

export function relativeTime(date: Date): string {
  return relativeTimeFrom(Date.now(), date);
}

export function relativeTimeFrom(
  now: number,
  date: Date
): string {
  const delta = Math.round((now - date.getTime()) / 1000);
  const abs = Math.abs(delta);

  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];

  let value = abs;
  let unit = "s";

  for (const [limit, name] of units) {
    if (value < limit) {
      unit = name;
      break;
    }
    value /= limit;
  }

  const rounded = Math.floor(value);
  return delta >= 0
    ? `${rounded}${unit} ago`
    : `in ${rounded}${unit}`;
}
