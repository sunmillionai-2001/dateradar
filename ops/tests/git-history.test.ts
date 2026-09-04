import { describe, expect, test, vi } from "vitest";

import { readGitHistory } from "@/lib/git/history";

describe("Git history source", () => {
  test.each([1, 15, 365])("rejects non-allowlisted range %s", async (range) => {
    await expect(readGitHistory(range, { execFile: vi.fn(), repoRoot: "/repo" }))
      .rejects.toThrow("Range must be 7, 14, or 30 days.");
  });

  test("parses commit facts and changed filenames", async () => {
    const fixture = [
      "\u001eae3e92d\u001f2026-09-04T08:00:00+08:00\u001fdocs: switch audio transcription plan",
      "product-spec.md",
      "",
      "\u001edf723e7\u001f2026-09-03T12:30:00+08:00\u001ffeat: secure full report unlock flow",
      "src/app/api/unlock/route.ts",
      "src/lib/server/report-store.ts",
      "",
    ].join("\n");
    const execFile = vi.fn().mockResolvedValue({ stdout: fixture, stderr: "" });

    const commits = await readGitHistory(7, { execFile, repoRoot: "/repo" });

    expect(commits).toEqual([
      {
        hash: "ae3e92d",
        date: "2026-09-04T08:00:00+08:00",
        subject: "docs: switch audio transcription plan",
        files: ["product-spec.md"],
      },
      {
        hash: "df723e7",
        date: "2026-09-03T12:30:00+08:00",
        subject: "feat: secure full report unlock flow",
        files: ["src/app/api/unlock/route.ts", "src/lib/server/report-store.ts"],
      },
    ]);
  });

  test("uses an argument array for git log without a shell", async () => {
    const execFile = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });

    await readGitHistory(14, { execFile, repoRoot: "/repo" });

    expect(execFile).toHaveBeenCalledOnce();
    expect(execFile.mock.calls[0][0]).toBe("git");
    expect(execFile.mock.calls[0][1]).toEqual(expect.arrayContaining([
      "log",
      "--since=14 days ago",
      "--date=iso-strict",
      "--name-only",
    ]));
    expect(execFile.mock.calls[0][2]).toEqual({ cwd: "/repo", maxBuffer: 1_000_000 });
  });
});
