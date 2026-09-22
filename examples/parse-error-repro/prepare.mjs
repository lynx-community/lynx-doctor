import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const relativePath = "sdk/task/components/CommonDailyTask/styles.test.ts";
const file = fileURLToPath(new URL(relativePath, import.meta.url));
fs.mkdirSync(path.dirname(file), { recursive: true });
// Leave the object open, with EOF at line 772, to reproduce the reported location.
fs.writeFileSync(file, "export const styles = {\n" + "  // intentionally unclosed fixture\n".repeat(770));
console.log(`Prepared ${relativePath}:772:1 with an intentionally missing closing brace.`);
