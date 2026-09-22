declare const __LYNX_DOCTOR_VERSION__: string;
export const VERSION: string = __LYNX_DOCTOR_VERSION__;

export const CATEGORIES = ["reactlynx", "lynx-ui", "rspeedy", "lynx-css"] as const;

export const CSS_BACKENDS = ["android", "ios", "harmony", "clay_android", "clay_ios", "clay_macos", "clay_windows", "web_lynx"] as const;
export type CssBackend = (typeof CSS_BACKENDS)[number];
/** Minimum Lynx engine version per rendering backend, not the ReactLynx npm version. */
export type CssTargets = Readonly<Partial<Record<CssBackend, string>>>;
export interface CssCoverage {
  readonly status: "checked" | "not-configured" | "disabled";
  readonly dataVersion: string;
  readonly targets: CssTargets;
  readonly files: number;
  readonly declarations: number;
  readonly unknownComparisons: number;
}

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
  | "bundle-size"
  | "compatibility"
  | "elements"
  | "packaging";
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
  readonly targets?: CssTargets;
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
  /** Inspect already-built component library entry files in the working tree. */
  readonly package?: boolean;
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

export interface ParseError {
  readonly filePath: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
}

export interface ScanReport {
  readonly ok: boolean;
  readonly generatedAt: string;
  readonly durationMs: number;
  readonly project: ProjectInfo;
  readonly configPath: string | null;
  readonly scannedFiles: readonly string[];
  readonly diagnostics: readonly Diagnostic[];
  /** Files that could not be parsed. Any entry makes the scan incomplete and ok false. */
  readonly parseErrors?: readonly ParseError[];
  readonly score: number;
  readonly summary: ScanSummary;
  readonly blocking: BlockingLevel;
  readonly scope?: {
    readonly mode: "full" | "diff" | "staged";
    readonly base?: string;
    readonly applicableSourceFiles: number;
  };
  readonly cssCoverage?: CssCoverage;
  readonly notices?: readonly string[];
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
