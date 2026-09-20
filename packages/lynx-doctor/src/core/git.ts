import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const runGit = (directory: string, args: readonly string[]): string | null => {
  try {
    return execFileSync("git", [...args], {
      cwd: directory,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch {
    return null;
  }
};

const requireGit = (directory: string, args: readonly string[]): string => {
  const output = runGit(directory, args);
  if (output === null) {
    throw new Error("Could not run git " + args.join(" ") + ". Check the ref and fetch the required history.");
  }
  return output;
};

const splitPaths = (output: string): string[] => output.split("\0").filter(Boolean);

const canResolveRef = (directory: string, ref: string): boolean =>
  runGit(directory, ["rev-parse", "--verify", "--quiet", "--end-of-options", ref + "^{commit}"]) !== null;

const detectBaseRef = (directory: string): string | null => {
  for (const ref of ["origin/main", "origin/master", "main", "master"]) {
    if (canResolveRef(directory, ref)) return ref;
  }
  return null;
};

export interface SourceSelection {
  readonly files: readonly string[];
  readonly readFile: (filePath: string) => string | null;
}

export const readWorkingFile = (filePath: string): string | null => {
  try {
    if (!fs.statSync(filePath).isFile()) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

export const toPosixRelativePath = (rootDirectory: string, filePath: string): string =>
  path.relative(rootDirectory, filePath).split(path.sep).join("/");

export const listChangedFiles = (
  projectRoot: string,
  options: { readonly staged?: boolean; readonly diff?: boolean | string },
): SourceSelection | null => {
  if (options.staged && options.diff) throw new Error("Use either --staged or --diff, not both.");
  if (!options.staged && !options.diff) return null;

  const rootOutput = runGit(projectRoot, ["rev-parse", "--show-toplevel"]);
  if (rootOutput === null) throw new Error("--diff and --staged require a Git working tree.");
  const gitRoot = rootOutput.trimEnd();
  const diffArgs = ["diff", "--name-only", "--diff-filter=ACMRT", "-z"];
  let changed: string[];

  if (options.staged) {
    changed = splitPaths(requireGit(gitRoot, [...diffArgs, "--cached"]));
  } else {
    const requestedBase = typeof options.diff === "string" ? options.diff : null;
    const base = requestedBase ?? detectBaseRef(gitRoot);
    if (base !== null && !canResolveRef(gitRoot, base)) {
      throw new Error("Cannot resolve --diff base: " + base);
    }
    const committed = base === null ? [] : splitPaths(requireGit(gitRoot, [...diffArgs, base + "...HEAD", "--"]));
    const working = splitPaths(requireGit(gitRoot, [...diffArgs, "--"]));
    const staged = splitPaths(requireGit(gitRoot, [...diffArgs, "--cached", "--"]));
    const untracked = splitPaths(requireGit(gitRoot, ["ls-files", "--others", "--exclude-standard", "-z"]));
    changed = [...committed, ...working, ...staged, ...untracked];
  }

  const prefix = requireGit(projectRoot, ["rev-parse", "--show-prefix"]).trimEnd();
  const repositoryPaths = new Map(
    [...new Set(changed)]
      .filter((filePath) => filePath.startsWith(prefix))
      .map((filePath) => [path.resolve(projectRoot, filePath.slice(prefix.length)), filePath]),
  );

  return {
    files: [...repositoryPaths.keys()].sort(),
    readFile: options.staged
      ? (filePath) => requireGit(gitRoot, ["show", ":" + repositoryPaths.get(filePath)])
      : readWorkingFile
  };
};
