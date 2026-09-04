import { execFile as nodeExecFile } from "node:child_process";
import path from "node:path";

import type { GitCommit } from "@/lib/types";

type ExecFileResult = { stdout: string; stderr: string };
type ExecFile = (
  file: string,
  args: string[],
  options: { cwd: string; maxBuffer: number },
) => Promise<ExecFileResult>;

type GitDependencies = {
  execFile?: ExecFile;
  repoRoot?: string;
};

const ALLOWED_RANGES = new Set([7, 14, 30]);

function executeFile(file: string, args: string[], options: { cwd: string; maxBuffer: number }) {
  return new Promise<ExecFileResult>((resolve, reject) => {
    nodeExecFile(file, args, { ...options, encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Unable to read Git history: ${error.message}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function parseHistory(stdout: string): GitCommit[] {
  return stdout
    .split("\u001e")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [header = "", ...fileLines] = record.split("\n");
      const [hash = "", date = "", subject = ""] = header.split("\u001f");
      return {
        hash: hash.trim(),
        date: date.trim(),
        subject: subject.trim(),
        files: fileLines.map((file) => file.trim()).filter(Boolean),
      };
    })
    .filter((commit) => commit.hash && commit.date && commit.subject);
}

export async function readGitHistory(rangeDays: number, dependencies: GitDependencies = {}): Promise<GitCommit[]> {
  if (!ALLOWED_RANGES.has(rangeDays)) throw new Error("Range must be 7, 14, or 30 days.");
  const execFile = dependencies.execFile ?? executeFile;
  const repoRoot = dependencies.repoRoot ?? path.resolve(process.cwd(), "..");
  const { stdout } = await execFile(
    "git",
    [
      "log",
      `--since=${rangeDays} days ago`,
      "--date=iso-strict",
      "--max-count=80",
      "--pretty=format:%x1e%h%x1f%aI%x1f%s",
      "--name-only",
    ],
    { cwd: repoRoot, maxBuffer: 1_000_000 },
  );
  return parseHistory(stdout);
}
