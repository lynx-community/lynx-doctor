export const VERSION = "0.0.1";

export const CATEGORIES = ["reactlynx", "lynx-ui", "rspeedy"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Subcategory =
  | "threading"
  | "lifecycle"
  | "events"
  | "configuration"
  | "performance"
  | "imports"
  | "component-api"
  | "gestures"
  | "bundle-size";
export type Severity = "error" | "warning";
export type SeverityOverride = Severity | "off";
export type BlockingLevel = "error" | "warning" | "none";

export interface RuleSource {
  readonly kind: "skill";
  readonly repo: string;
  readonly ref: string;
  readonly skill: string;
  readonly protocol: string;
  readonly entrypoint: string;
  readonly docsPath: string;
  readonly rawUrl: string;
  readonly webUrl: string;
  readonly supportingPaths: readonly string[];
}

export interface RuleDefinition {
  readonly id: string;
  readonly title: string;
  readonly category: Category;
  readonly subcategory: Subcategory;
  readonly defaultSeverity: Severity;
  readonly impact: "critical" | "medium" | "low";
  readonly summary: string;
  readonly why: string;
  readonly fix: string;
  readonly docsUrl: string;
  readonly source: RuleSource;
  readonly tags: readonly string[];
}

export interface Diagnostic {
  readonly ruleId: string;
  readonly title: string;
  readonly category: Category;
  readonly subcategory: Subcategory;
  readonly severity: Severity;
  readonly message: string;
  readonly help: string;
  readonly filePath: string;
  readonly line: number;
  readonly column: number;
  readonly sourceLine?: string;
  readonly docsUrl: string;
  readonly source: RuleSource;
  readonly tags: readonly string[];
}

export interface LynxDoctorConfig {
  readonly ignore?: {
    readonly files?: readonly string[];
  };
  readonly rules?: Readonly<Record<string, SeverityOverride>>;
  readonly categories?: Readonly<Record<string, SeverityOverride>>;
  readonly agent?: {
    readonly command?: string;
  };
}

export interface ResolvedConfig {
  readonly path: string | null;
  readonly config: LynxDoctorConfig;
}

export interface ProjectInfo {
  readonly rootDirectory: string;
  readonly projectName: string;
  readonly packageManager: "pnpm" | "yarn" | "npm" | "bun" | "unknown";
  readonly framework: "ReactLynx" | "Lynx" | "Unknown";
  readonly hasReactLynx: boolean;
  readonly hasRspeedy: boolean;
  readonly hasLynxUi: boolean;
  readonly hasLynxTypes: boolean;
  readonly hasTypeScript: boolean;
  readonly sourceFileCount: number;
  readonly dependencies: Readonly<Record<string, string>>;
  readonly configFiles: readonly string[];
}

export interface ScanOptions {
  readonly directory?: string;
  readonly categories?: readonly string[];
  readonly diff?: boolean | string;
  readonly staged?: boolean;
  readonly includeWarnings?: boolean;
  readonly blocking?: BlockingLevel;
  readonly verbose?: boolean;
}

export interface ScanSummary {
  readonly errorCount: number;
  readonly warningCount: number;
  readonly fileCount: number;
  readonly ruleCount: number;
}

export interface ScanReport {
  readonly ok: boolean;
  readonly generatedAt: string;
  readonly durationMs: number;
  readonly project: ProjectInfo;
  readonly configPath: string | null;
  readonly scannedFiles: readonly string[];
  readonly diagnostics: readonly Diagnostic[];
  readonly score: number;
  readonly summary: ScanSummary;
  readonly blocking: BlockingLevel;
}

export interface InstallOptions {
  readonly rootDirectory: string;
  readonly dryRun?: boolean;
  readonly yes?: boolean;
}

export interface InstallResult {
  readonly rootDirectory: string;
  readonly changedFiles: readonly string[];
  readonly messages: readonly string[];
  readonly dryRun: boolean;
}

export const defineConfig = (config: LynxDoctorConfig): LynxDoctorConfig => config;
