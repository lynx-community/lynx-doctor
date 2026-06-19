import { execFileSync } from "node:child_process";
import path from "node:path";

const runGit = (rootDirectory: string, args: readonly string[]): string | null => {
  try {
    return execFileSync("git", [...args], {
      cwd: rootDirectory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch {
    return null;
  }
};

const splitGitLines = (output: string | null): string[] | null => {
  if (output === null) return null;
  return output
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);
};

const canResolveRef = (rootDirectory: string, ref: string): boolean =>
  runGit(rootDirectory, ["rev-parse", "--verify", "--quiet", ref]) !== null;

const detectBaseRef = (rootDirectory: string): string | null => {
  for (const ref of ["origin/main", "origin/master", "main", "master"]) {
    if (canResolveRef(rootDirectory, ref)) return ref;
  }
  return null;
};

export const listChangedFiles = (
  rootDirectory: string,
  options: { readonly staged?: boolean; readonly diff?: boolean | string },
): string[] | null => {
  if (options.staged) {
    return splitGitLines(runGit(rootDirectory, ["diff", "--name-only", "--cached"]));
  }

  if (!options.diff) return null;
  const requestedBase = typeof options.diff === "string" ? options.diff : undefined;
  const baseRef = requestedBase ?? detectBaseRef(rootDirectory);
  if (!baseRef) {
    return splitGitLines(runGit(rootDirectory, ["diff", "--name-only", "HEAD"]));
  }

  const mergeDiff = splitGitLines(runGit(rootDirectory, ["diff", "--name-only", `${baseRef}...HEAD`]));
  if (mergeDiff !== null) return mergeDiff;
  return splitGitLines(runGit(rootDirectory, ["diff", "--name-only", baseRef]));
};

export const toPosixRelativePath = (rootDirectory: string, filePath: string): string =>
  path.relative(rootDirectory, filePath).split(path.sep).join("/");
