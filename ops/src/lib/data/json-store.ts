import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { DEFAULT_DATA_DIR, RUNTIME_EXAMPLES, type RuntimeFilename } from "@/lib/data/paths";

const writeQueues = new Map<string, Promise<void>>();

function assertRuntimeFilename(filename: string): asserts filename is RuntimeFilename {
  if (!(filename in RUNTIME_EXAMPLES)) {
    throw new Error(`Unsupported runtime data file: ${filename}`);
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function queueForPath<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
  const previous = writeQueues.get(filePath) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  const current = result.then(() => undefined, () => undefined);
  writeQueues.set(filePath, current);
  void current.finally(() => {
    if (writeQueues.get(filePath) === current) writeQueues.delete(filePath);
  });
  return result;
}

async function writeJsonNow<T>(filePath: string, value: T) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

export async function readRuntimeJson<T>(
  filename: string,
  fallbackName: string,
  dataDir = DEFAULT_DATA_DIR,
): Promise<T> {
  assertRuntimeFilename(filename);
  if (RUNTIME_EXAMPLES[filename] !== fallbackName) {
    throw new Error(`Unsupported runtime example file: ${fallbackName}`);
  }

  const filePath = path.join(dataDir, filename);
  try {
    return await readJson<T>(filePath);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }

  return queueForPath(filePath, async () => {
    try {
      return await readJson<T>(filePath);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
    }
    const initialValue = await readJson<T>(path.join(dataDir, fallbackName));
    await writeJsonNow(filePath, initialValue);
    return initialValue;
  });
}

export async function writeRuntimeJson<T>(filename: string, value: T, dataDir = DEFAULT_DATA_DIR): Promise<void> {
  assertRuntimeFilename(filename);
  const filePath = path.join(dataDir, filename);
  await queueForPath(filePath, () => writeJsonNow(filePath, value));
}

export async function updateRuntimeJson<T>(
  filename: string,
  fallbackName: string,
  update: (current: T) => T | Promise<T>,
  dataDir = DEFAULT_DATA_DIR,
): Promise<T> {
  assertRuntimeFilename(filename);
  if (RUNTIME_EXAMPLES[filename] !== fallbackName) {
    throw new Error(`Unsupported runtime example file: ${fallbackName}`);
  }

  const filePath = path.join(dataDir, filename);
  return queueForPath(filePath, async () => {
    let current: T;
    try {
      current = await readJson<T>(filePath);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
      current = await readJson<T>(path.join(dataDir, fallbackName));
    }
    const next = await update(current);
    await writeJsonNow(filePath, next);
    return next;
  });
}
