# Source parse error reproduction

This is an intentionally malformed scanner fixture. It does not run or build a Lynx application. Node.js >= 22.12.0 is required; installing this example's dependencies is unnecessary for the scan.

## Reproduce the original failure

From the repository root:

```bash
cd examples/parse-error-repro
npm run repro
```

The script generates `sdk/task/components/CommonDailyTask/styles.test.ts` with an unclosed object and EOF at line 772, then runs the published `lynx-doctor@0.1.1`. The version is pinned so the reproduction keeps working after a fixed release is published. The first run may download the CLI through `npx`.

Expected output, with the absolute path shortened:

```text
lynx-doctor failed: Cannot parse .../sdk/task/components/CommonDailyTask/styles.test.ts:772:1: '}' expected.
```

The old scanner exits before checking `src/after-error.ts`.

## Compare with the local fix

From the repository root, build the CLI on the fix branch and scan the same fixture:

```bash
pnpm --filter lynx-doctor build
cd examples/parse-error-repro
npm run doctor:local
```

The updated scanner reports:

```text
Scan incomplete: 1 file could not be parsed.
  PARSE ERROR sdk/task/components/CommonDailyTask/styles.test.ts:772:1
    '}' expected.
```

It also checks `src/after-error.ts`. Both commands intentionally exit with code 1: the fixed scanner finishes checking the remaining files, but the fixture still has a parse error. Neither command launches a coding agent.

The generated `sdk/` directory is ignored by Git. Each command regenerates the invalid file; leave it malformed when using this reproduction.
