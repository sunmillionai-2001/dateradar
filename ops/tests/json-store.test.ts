import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { readRuntimeJson, writeRuntimeJson } from "@/lib/data/json-store";

const tempDirs: string[] = [];

async function createDataDir() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "datexray-ops-store-"));
  tempDirs.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("runtime JSON storage", () => {
  test("initializes an ignored runtime file from its committed example", async () => {
    const dataDir = await createDataDir();
    await writeFile(path.join(dataDir, "topics.example.json"), '{"version":1,"topics":[]}\n');

    const topics = await readRuntimeJson<{ version: number; topics: unknown[] }>(
      "topics.json",
      "topics.example.json",
      dataDir,
    );

    expect(topics).toEqual({ version: 1, topics: [] });
    expect(JSON.parse(await readFile(path.join(dataDir, "topics.json"), "utf8"))).toEqual(topics);
  });

  test("atomically replaces JSON without leaving temporary files", async () => {
    const dataDir = await createDataDir();

    await writeRuntimeJson("content-ledger.json", { version: 1, entries: [{ id: "one" }] }, dataDir);
    await writeRuntimeJson("content-ledger.json", { version: 1, entries: [{ id: "two" }] }, dataDir);

    expect(JSON.parse(await readFile(path.join(dataDir, "content-ledger.json"), "utf8"))).toEqual({
      version: 1,
      entries: [{ id: "two" }],
    });
    expect((await readdir(dataDir)).filter((name) => name.endsWith(".tmp"))).toEqual([]);
  });

  test("rejects paths outside the runtime data allowlist", async () => {
    const dataDir = await createDataDir();

    await expect(writeRuntimeJson("../private.json", { secret: true }, dataDir)).rejects.toThrow(
      "Unsupported runtime data file",
    );
  });
});
