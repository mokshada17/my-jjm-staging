import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * `echarts-for-react/lib/core` is CommonJS. Vite's dev server resolves its default
 * export to the module namespace object, so every chart dies at render with
 * "Element type is invalid". The `esm/core` build exports the component properly.
 *
 * This is asserted by scanning source rather than by importing, because Vitest's CJS
 * interop differs from the dev server's — a plain `typeof` check passes under Vitest
 * even with the broken path, so it would not catch the regression.
 */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    // Test files are skipped so this file's own doc comment is not a match.
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe("echarts-for-react import path", () => {
  it("never deep-imports the CommonJS lib/ build", () => {
    const offenders = sourceFiles("src").filter((f) =>
      readFileSync(f, "utf8").includes("echarts-for-react/lib/")
    );

    expect(offenders).toEqual([]);
  });

  it("imports the esm build wherever charts are rendered", () => {
    const chartFiles = sourceFiles("src/widgets/telemetry-charts-panel").filter(
      (f) => readFileSync(f, "utf8").includes("echarts-for-react")
    );

    expect(chartFiles.length).toBeGreaterThan(0);
    for (const f of chartFiles) {
      expect(readFileSync(f, "utf8")).toContain("echarts-for-react/esm/core");
    }
  });
});
