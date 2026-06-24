export {
  CATEGORIES,
  VERSION,
  defineConfig,
  type BlockingLevel,
  type Category,
  type Diagnostic,
  type InstallOptions,
  type InstallResult,
  type LynxDoctorConfig,
  type ProjectInfo,
  type RuleDefinition,
  type RuleSource,
  type ScanOptions,
  type ScanReport,
  type Severity,
  type Subcategory
} from "./core/types.js";
export { scanProject } from "./core/scanner.js";
export { formatReport, formatScore } from "./core/report.js";
export { buildAgentPrompt, launchAgent } from "./core/agent.js";
export { installLynxDoctor } from "./core/install.js";
export { RULES } from "./rules/catalog.js";
