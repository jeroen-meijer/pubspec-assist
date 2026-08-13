import * as esbuild from "esbuild";
import fs from "node:fs";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * @param {esbuild.Metafile | undefined} metafile
 */
function assertRuntimeDepsBundled(metafile) {
  if (!metafile) {
    throw new Error("esbuild metafile missing; cannot verify bundled deps");
  }
  const inputs = Object.keys(metafile.inputs);
  for (const dep of ["yaml", "fuse.js"]) {
    const bundled = inputs.some(
      (input) =>
        input.includes(`node_modules/${dep}/`) ||
        input.includes(`node_modules\\${dep}\\`)
    );
    if (!bundled) {
      throw new Error(
        `out/extension.js is missing ${dep}; vsce --no-dependencies would ship a broken VSIX`
      );
    }
  }
}

const ctx = await esbuild.context({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: "node",
  outfile: "out/extension.js",
  external: ["vscode"],
  metafile: true,
  logLevel: "info",
});

if (watch) {
  await ctx.watch();
} else {
  const result = await ctx.rebuild();
  assertRuntimeDepsBundled(result.metafile);
  if (!fs.existsSync("out/extension.js")) {
    throw new Error("esbuild did not write out/extension.js");
  }
  await ctx.dispose();
}
