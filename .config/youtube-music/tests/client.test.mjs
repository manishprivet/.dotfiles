import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { boundedResponse, cacheArtwork, normalizeSong, readSong, safeArtwork } from "../client.mjs";

const context = { module: { exports: {} } };
runInNewContext(readFileSync(new URL("../../../omarchy/.config/omarchy/plugins/manish.youtube-music/Model.js", import.meta.url), "utf8"), context);
const { sharedText, truncate, transitionConfirmed, positionAt, formatTime } = context.module.exports;

test("normalizes playing, paused, empty and malformed song responses", () => {
  assert.equal(normalizeSong({ title: "Song\nName", artist: "Artist", isPaused: false }).label, "Song Name - Artist");
  assert.equal(normalizeSong({ title: "Song", isPaused: true }).isPaused, true);
  assert.deepEqual(normalizeSong({}), { ok: true, available: false });
  assert.throws(() => normalizeSong(null));
  assert.throws(() => normalizeSong({ title: "Song", isPaused: "false" }));
  assert.equal(normalizeSong({ title: "x".repeat(2000), isPaused: false }).title.length, 512);
});

test("only accepts bounded HTTPS artwork from known YouTube image hosts", () => {
  assert.equal(safeArtwork("https://i.ytimg.com/vi/id/default.jpg"), "https://i.ytimg.com/vi/id/default.jpg");
  for (const url of ["file:///etc/passwd", "http://i.ytimg.com/x", "https://i.ytimg.com.evil.invalid/x",
    "https://127.0.0.1/x", "https://user@i.ytimg.com/x", "https://i.ytimg.com:8080/x"]) {
    assert.equal(safeArtwork(url), "");
  }
});

test("fixed loopback API and explicit actions; actions refresh song info", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push([url, options.method, options.redirect]);
    return new Response(url.endsWith("song-info") ? JSON.stringify({ title: "Test", artist: "Artist", isPaused: false }) : "");
  };
  assert.equal((await readSong({ action: "next", fetchImpl })).label, "Test - Artist");
  assert.deepEqual(calls, [
    ["http://127.0.0.1:26538/api/v1/next", "POST", "error"],
    ["http://127.0.0.1:26538/api/v1/song-info", "GET", "error"],
  ]);
  await readSong({ action: "toggle-play", fetchImpl });
  assert.equal(calls[2][0], "http://127.0.0.1:26538/api/v1/toggle-play");
  await assert.rejects(readSong({ action: "bad", fetchImpl }));
});

test("HTTP errors, invalid JSON, unavailable server and oversized responses fail cleanly", async () => {
  await assert.rejects(readSong({ fetchImpl: async () => new Response("", { status: 503 }) }));
  await assert.rejects(readSong({ fetchImpl: async () => new Response("not json") }));
  await assert.rejects(readSong({ fetchImpl: async () => { throw new Error("offline"); } }));
  await assert.rejects(boundedResponse(new Response("x".repeat(100)), 50));
});

test("204 playback acknowledgements still fetch the updated song", async () => {
  for (const action of ["toggle-play", "previous", "next"]) {
    const calls = [];
    const song = await readSong({ action, fetchImpl: async (url, options) => {
      calls.push([url, options.method]);
      return options.method === "POST" ? new Response(null, { status: 204 })
        : Response.json({ title: "Updated song", artist: "Artist", isPaused: false });
    } });
    assert.equal(song.available, true);
    assert.equal(song.label, "Updated song - Artist");
    assert.equal(calls.length, 2);
    assert.equal(calls[1][0], "http://127.0.0.1:26538/api/v1/song-info");
  }
});

test("failed or timed-out controls still refresh without replaying the POST", async () => {
  for (const timeout of [false, true]) {
    const calls = [];
    const song = await readSong({ action: "toggle-play", fetchImpl: async (url, options) => {
      calls.push(options.method);
      if (options.method === "POST") {
        if (timeout) throw new Error("Request timed out after the player received it");
        return new Response(null, {status: 503});
      }
      return Response.json({title: "Current song", isPaused: false});
    } });
    assert.deepEqual(calls, ["POST", "GET"]);
    assert.equal(song.available, true);
    assert.equal(song.actionFailed, true);
  }
});

test("seek sends bounded seconds as JSON and immediately refreshes song info", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({url, ...options});
    return options.method === "POST" ? new Response(null, {status: 204})
      : Response.json({title: "Song", videoId: "fixture", songDuration: 240, elapsedSeconds: 120, isPaused: true});
  };
  const song = await readSong({action: "seek-to", seconds: 120, fetchImpl});
  assert.equal(calls[0].url, "http://127.0.0.1:26538/api/v1/seek-to");
  assert.equal(calls[0].headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].body), {seconds: 120});
  assert.equal(calls[1].method, "GET");
  assert.equal(song.durationSeconds, 240);
  assert.equal(song.elapsedSeconds, 120);
  assert.equal(song.trackId, "fixture");
  for (const seconds of [undefined, NaN, Infinity, -1, 604801, "120"]) {
    await assert.rejects(readSong({action: "seek-to", seconds, fetchImpl}));
  }
  assert.equal(calls.length, 2, "Invalid seeks must not reach the API");
});

test("Omarchy tooltip neutralizes markup without interpreting song titles", () => {
  assert.equal(sharedText('<img src="https://example.invalid/tracker"> & <b>song</b>'),
    '‹img src="https://example.invalid/tracker"› ＆ ‹b›song‹/b›');
  assert.equal(truncate("abcdef", 4), "abc…");
});

test("a command acknowledgement or unchanged snapshot cannot confirm a track switch", () => {
  const before = {available: true, trackId: "first", label: "Song - Artist", isPaused: false, elapsedSeconds: 40};
  assert.equal(transitionConfirmed("next", before, {...before}), false);
  assert.equal(transitionConfirmed("next", before, {...before, trackId: "second"}), true);
  assert.equal(transitionConfirmed("next", before, {available: false}), false);
  assert.equal(transitionConfirmed("previous", before, {...before, elapsedSeconds: 0}), true);
  assert.equal(transitionConfirmed("next", before, {...before, elapsedSeconds: 0}), false);
  assert.equal(transitionConfirmed("toggle-play", before, {...before}), false);
  assert.equal(transitionConfirmed("toggle-play", before, {...before, isPaused: true}), true);
  assert.equal(transitionConfirmed("seek-to", before, {...before, elapsedSeconds: 120}, 120), true);
  assert.equal(transitionConfirmed("seek-to", before, {...before, elapsedSeconds: 40}, 120), false);
  assert.equal(transitionConfirmed("seek-to", before, {...before, trackId: "another", elapsedSeconds: 120}, 120), false);
});

test("track position advances locally, freezes on pause and stays within duration", () => {
  const song = {available: true, elapsedSeconds: 65, durationSeconds: 240, isPaused: false};
  assert.equal(positionAt(song, 1000, 6000), 70);
  assert.equal(positionAt({...song, isPaused: true}, 1000, 6000), 65);
  assert.equal(positionAt(song, 1000, 900000), 240);
  assert.equal(positionAt({available: false}, 1000, 6000), 0);
  assert.equal(formatTime(65), "1:05");
  assert.equal(formatTime(3605), "1:00:05");
});

test("artwork is locally cached, reused and rejects non-image responses", async () => {
  const scratch = await mkdtemp(join(existsSync("/tmp/opencode") ? "/tmp/opencode" : tmpdir(), "music-cover."));
  const previousCache = process.env.XDG_CACHE_HOME;
  const previousFetch = globalThis.fetch;
  try {
    process.env.XDG_CACHE_HOME = scratch;
    let requests = 0;
    globalThis.fetch = async (url, options) => {
      requests++;
      assert.equal(options.redirect, "error");
      return new Response("fixture-image", { headers: { "content-type": "image/jpeg" } });
    };
    const url = "https://i.ytimg.com/vi/fixture/default.jpg";
    const path = await cacheArtwork(url);
    assert.ok(path.startsWith(scratch));
    assert.equal(await readFile(path, "utf8"), "fixture-image");
    assert.equal(await cacheArtwork(url), path);
    assert.equal(requests, 1);
    assert.equal(await cacheArtwork("https://example.invalid/tracker"), "");
    assert.equal(requests, 1);
    globalThis.fetch = async () => new Response("not an image", { headers: { "content-type": "text/html" } });
    assert.equal(await cacheArtwork("https://i.ytimg.com/vi/other/default.jpg"), "");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousCache === undefined) delete process.env.XDG_CACHE_HOME;
    else process.env.XDG_CACHE_HOME = previousCache;
    await rm(scratch, { recursive: true, force: true });
  }
});
