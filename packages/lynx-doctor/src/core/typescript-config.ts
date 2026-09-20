import path from "node:path";
import ts from "typescript";

export const readCompilerOptions = (filePath: string): ts.CompilerOptions => {
  const fail = (diagnostic: ts.Diagnostic): never => {
    throw new Error(`Cannot read ${filePath}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
  };
  // TypeScript expects canonical forward slashes, including its malformed-JSON error path.
  const configPath = filePath.split(path.sep).join("/");
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, {
    ...ts.sys,
    getCurrentDirectory: () => path.dirname(configPath).split(path.sep).join("/"),
    // Only configuration is needed; do not enumerate the project's source tree.
    readDirectory: () => [],
    onUnRecoverableConfigFileDiagnostic: fail
  });
  const error = parsed?.errors.find((diagnostic) => diagnostic.code !== 18002 && diagnostic.code !== 18003);
  if (error) fail(error);
  return parsed?.options ?? {};
};
