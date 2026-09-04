import { readFile } from "node:fs/promises";
import path from "node:path";

const STATIC_FILES = new Set([
  "brand-voice.json",
  "content-types.json",
  "visual-templates.json",
]);

export async function readStaticJson<T>(filename: string, dataDir = path.join(process.cwd(), "data")): Promise<T> {
  if (!STATIC_FILES.has(filename)) {
    throw new Error(`Unsupported static data file: ${filename}`);
  }

  const contents = await readFile(path.join(dataDir, filename), "utf8");
  return JSON.parse(contents) as T;
}
