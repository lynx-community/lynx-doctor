import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
import type { LynxDoctorConfig, ResolvedConfig, SeverityOverride } from "./types.js";
import { readPackageJsonConfig } from "./project.js";

const CONFIG_FILE_NAMES = [
  "lynx-doctor.config.ts",
  "lynx-doctor.config.mts",
  "lynx-doctor.config.js",
  "lynx-doctor.config.mjs",
  "lynx-doctor.config.cjs",
  "lynx-doctor.config.json",
  "doctor.config.ts",
  "doctor.config.mjs",
  "doctor.config.js",
  "doctor.config.json"
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeSeverityMap = (value: unknown): Record<string, SeverityOverride> | undefined => {
  if (!isRecord(value)) return undefined;
  const result: Record<string, SeverityOverride> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (raw === "error" || raw === "warning" || raw === "off") result[key] = raw;
    if (raw === "warn") result[key] = "warning";
  }
  return result;
};

export const normalizeConfig = (value: unknown): LynxDoctorConfig => {
  if (!isRecord(value)) return {};
  const ignoreFiles =
    isRecord(value.ignore) && Array.isArray(value.ignore.files)
      ? value.ignore.files.filter((item): item is string => typeof item === "string")
      : [];
  const ignore = ignoreFiles.length > 0 ? { files: ignoreFiles } : undefined;
  const rules = normalizeSeverityMap(value.rules);
  const categories = normalizeSeverityMap(value.categories);
  const agent = isRecord(value.agent) && typeof value.agent.command === "string"
    ? { command: value.agent.command }
    : undefined;

  return {
    ...(ignore ? { ignore } : {}),
    ...(rules ? { rules } : {}),
    ...(categories ? { categories } : {}),
    ...(agent ? { agent } : {})
  };
};

const findConfigFile = (rootDirectory: string): string | null => {
  for (const fileName of CONFIG_FILE_NAMES) {
    const candidate = path.join(rootDirectory, fileName);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
};

const loadConfigFile = async (configPath: string): Promise<LynxDoctorConfig> => {
  if (configPath.endsWith(".json")) {
    return normalizeConfig(JSON.parse(fs.readFileSync(configPath, "utf8")));
  }
  const jiti = createJiti(import.meta.url, { moduleCache: false, interopDefault: true });
  const importWithDefault = jiti.import as (
    id: string,
    options?: { default?: boolean },
  ) => Promise<unknown>;
  const loaded = await importWithDefault(configPath, { default: true });
  return normalizeConfig(loaded);
};

export const resolveConfig = async (rootDirectory: string): Promise<ResolvedConfig> => {
  const configPath = findConfigFile(rootDirectory);
  if (configPath) {
    return {
      path: configPath,
      config: await loadConfigFile(configPath)
    };
  }

  return {
    path: null,
    config: normalizeConfig(readPackageJsonConfig(rootDirectory))
  };
};
