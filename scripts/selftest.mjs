/* npm run selftest — runs the engine's built-in self-tests (the same ones as __vl.runSelfTests() in the
   browser) under Node, by bundling src/lib/engine.ts with esbuild (already installed with Vite). */
import { build } from "esbuild";

const out = await build({
  entryPoints: ["src/lib/engine.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  logLevel: "error",
  tsconfig: "tsconfig.json",
});
const { runSelfTests } = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));
const results = runSelfTests();
const failed = results.filter((r) => !r.ok);
for (const r of failed) console.log("FAIL  " + r.name + (r.err ? " — " + r.err : ""));
console.log(results.length + " engine self-tests, " + failed.length + " failed");
process.exit(failed.length ? 1 : 0);
