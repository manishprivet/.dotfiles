import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

test("SketchyBar renders argv safely, maps artwork clicks once, and clears offline data", async () => {
  const scratch = await mkdtemp(join(existsSync("/tmp/opencode") ? "/tmp/opencode" : tmpdir(), "music-adapter."));
  try {
    const bin = join(scratch, "bin");
    await mkdir(bin);
    await writeFile(join(bin, "sketchybar"), `#!${process.execPath}
require("node:fs").appendFileSync(process.env.OUTPUT, JSON.stringify(process.argv.slice(2)) + "\\n");
`, { mode: 0o700 });
    const preload = join(scratch, "fixture.mjs");
    await writeFile(preload, `import { appendFileSync } from "node:fs";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
childProcess.spawn = (command) => {
  appendFileSync(process.env.CALLS, JSON.stringify(["launch:" + command, "OPEN"]) + "\\n");
  return {on() {}, unref() {}};
};
syncBuiltinESMExports();
globalThis.fetch = async (url, options) => {
  appendFileSync(process.env.CALLS, JSON.stringify([url, options.method]) + "\\n");
  if (process.env.OFFLINE) throw new Error("offline");
  return new Response(url.endsWith("song-info") ? JSON.stringify({title: 'Song $(touch /never-run) <b>title</b>', artist: "Artist", isPaused: false}) : "");
};
`);
    const output = join(scratch, "output");
    const calls = join(scratch, "calls");
    const adapter = join(dirname(fileURLToPath(import.meta.url)), "../sketchybar.mjs");
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, OUTPUT: output, CALLS: calls, NAME: "music-artwork", BUTTON: "left" };
    execFileSync(process.execPath, ["--import", preload, adapter], { env, timeout: 10000 });
    const updates = (await readFile(output, "utf8")).trim().split("\n").map(JSON.parse);
    assert.equal(updates[0][1], "music");
    assert.ok(updates[0].includes('label=Song $(touch /never-run) <b>title</b> - Artist'));
    assert.equal(updates[1][1], "music-artwork");
    const requests = (await readFile(calls, "utf8")).trim().split("\n").map(JSON.parse);
    assert.equal(requests.filter(([url]) => url.endsWith("toggle-play")).length, 1);
    for (const button of ["right", "other"]) {
      await writeFile(calls, "");
      execFileSync(process.execPath, ["--import", preload, adapter], { env: { ...env, BUTTON: button }, timeout: 10000 });
      const clickRequests = (await readFile(calls, "utf8")).trim().split("\n").map(JSON.parse);
      assert.equal(clickRequests.filter(([, method]) => method === "GET").length, 1);
      assert.equal(clickRequests.filter(([, method]) => method === "POST").length, button === "right" ? 1 : 0);
      if (button === "other") assert.equal(clickRequests[0][1], "OPEN");
    }
    await writeFile(output, "");
    execFileSync(process.execPath, ["--import", preload, adapter], { env: { ...env, OFFLINE: "1", BUTTON: "" }, timeout: 10000 });
    const offline = (await readFile(output, "utf8")).trim().split("\n").map(JSON.parse);
    assert.ok(offline[0].includes("label=YouTube Music"));
    assert.ok(offline[1].includes("drawing=off"));
    assert.ok(offline[1].includes("background.image="));
  } finally { await rm(scratch, { recursive: true, force: true }); }
});
