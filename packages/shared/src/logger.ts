/**
 * Simple console logger with timestamps and severity levels.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_NUM: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || "info";

const enabledLabels: Record<LogLevel, string> = {
  debug: "DBG",
  info: "INF",
  warn: "WRN",
  error: "ERR",
};

const severityColors: Record<LogLevel, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};

function timestamp(): string {
  const d = new Date();
  return d.toISOString();
}

function log(level: LogLevel, message: string, meta?: unknown): void {
  if (LEVEL_NUM[level] < LEVEL_NUM[currentLevel]) return;

  const label = enabledLabels[level];
  const color = severityColors[level];
  const reset = "\x1b[0m";
  const ts = timestamp();

  const parts = [`${color}[${label}]${reset}`, ts, message];

  if (meta !== undefined) {
    const str =
      typeof meta === "string"
        ? meta
        : JSON.stringify(meta, null, 0);
    parts.push(str);
  }

  const output = parts.join(" ");

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
      break;
  }
}

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export const logger = {
  debug: (message: string, meta?: unknown) => log("debug", message, meta),
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
};
