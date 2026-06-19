import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import type { ProjectInfo } from "./types.js";

const SOURCE_GLOBS = ["**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}"];
export const DEFAULT_IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.git/**",
  "**/.rspress/**",
  "**/doc_build/**"
];

interface PackageJson {
  readonly name?: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
  readonly lynxDoctor?: unknown;
}

const readJsonFile = <T>(filePath: string): T | null => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
};

export const findNearestPackageRoot = (startDirectory: string): string => {
  let current = path.resolve(startDirectory);
  while (true) {
    if (fs.existsSync(path.join(current, "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(startDirectory);
    current = parent;
  }
};

const collectDependencies = (packageJson: PackageJson | null): Record<string, string> => ({
  ...(packageJson?.dependencies ?? {}),
  ...(packageJson?.devDependencies ?? {}),
  ...(packageJson?.peerDependencies ?? {}),
  ...(packageJson?.optionalDependencies ?? {})
});

const detectPackageManager = (rootDirectory: string): ProjectInfo["packageManager"] => {
  if (fs.existsSync(path.join(rootDirectory, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(rootDirectory, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(rootDirectory, "package-lock.json"))) return "npm";
  if (fs.existsSync(path.join(rootDirectory, "bun.lockb"))) return "bun";
  return "unknown";
};

const listExistingConfigFiles = (rootDirectory: string): string[] => {
  const candidates = [
    "rspeedy.config.ts",
    "rspeedy.config.mts",
    "rspeedy.config.js",
    "rspeedy.config.mjs",
    "rspeedy.config.cjs",
    "lynx.config.ts",
    "lynx.config.js",
    "tsconfig.json",
    "src/rspeedy-env.d.ts"
  ];
  return candidates
    .map((filePath) => path.join(rootDirectory, filePath))
    .filter((filePath) => fs.existsSync(filePath));
};

export const discoverProject = async (directory: string): Promise<ProjectInfo> => {
  const rootDirectory = findNearestPackageRoot(directory);
  const packageJsonPath = path.join(rootDirectory, "package.json");
  const packageJson = readJsonFile<PackageJson>(packageJsonPath);
  const dependencies = collectDependencies(packageJson);
  const dependencyNames = new Set(Object.keys(dependencies));
  const hasReactLynx = dependencyNames.has("@lynx-js/react");
  const hasRspeedy =
    dependencyNames.has("@lynx-js/rspeedy") ||
    dependencyNames.has("@rspeedy/core") ||
    listExistingConfigFiles(rootDirectory).some((filePath) => path.basename(filePath).startsWith("rspeedy."));
  const hasLynxTypes = dependencyNames.has("@lynx-js/types");
  const framework = hasReactLynx ? "ReactLynx" : dependencyNames.has("@lynx-js/lynx") ? "Lynx" : "Unknown";
  const sourceFiles = await fg(SOURCE_GLOBS, {
    cwd: rootDirectory,
    absolute: false,
    onlyFiles: true,
    ignore: DEFAULT_IGNORE_PATTERNS
  });

  return {
    rootDirectory,
    projectName: packageJson?.name ?? path.basename(rootDirectory),
    packageManager: detectPackageManager(rootDirectory),
    framework,
    hasReactLynx,
    hasRspeedy,
    hasLynxTypes,
    hasTypeScript: fs.existsSync(path.join(rootDirectory, "tsconfig.json")),
    sourceFileCount: sourceFiles.length,
    dependencies,
    configFiles: listExistingConfigFiles(rootDirectory)
  };
};

export const readPackageJsonConfig = (rootDirectory: string): unknown => {
  const packageJson = readJsonFile<PackageJson>(path.join(rootDirectory, "package.json"));
  return packageJson?.lynxDoctor;
};
