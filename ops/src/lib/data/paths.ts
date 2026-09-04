import path from "node:path";

export const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");

export function runtimeDataDir() {
  return process.env.OPS_DATA_DIR?.trim() || DEFAULT_DATA_DIR;
}

export const RUNTIME_EXAMPLES = {
  "content-ledger.json": "content-ledger.example.json",
  "topics.json": "topics.example.json",
} as const;

export type RuntimeFilename = keyof typeof RUNTIME_EXAMPLES;
