import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const API = "http://127.0.0.1:26538/api/v1/";
const actions = new Set(["toggle-play", "previous", "next", "seek-to"]);
const clean = value => typeof value === "string"
  ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 512) : "";

export function normalizeSong(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid song");
  const title = clean(data.title);
  const artist = clean(data.artist);
  if (!title) return { ok: true, available: false };
  if (typeof data.isPaused !== "boolean") throw new Error("Invalid playback state");
  return {
    ok: true, available: true, title, artist,
    album: clean(data.album),
    isPaused: data.isPaused,
    trackId: clean(data.videoId),
    durationSeconds: Number.isFinite(data.songDuration) ? Math.max(0, Math.min(604800, data.songDuration)) : 0,
    elapsedSeconds: Number.isFinite(data.elapsedSeconds) ? Math.max(0, Math.min(604800, data.elapsedSeconds)) : 0,
    label: artist ? `${title} - ${artist}` : title,
    imageSrc: safeArtwork(data.imageSrc),
  };
}

export function safeArtwork(value) {
  if (typeof value !== "string" || value.length > 4096) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      /(^|\.)(ytimg\.com|googleusercontent\.com|ggpht\.com)$/.test(url.hostname) ? url.href : "";
  } catch { return ""; }
}

export async function boundedResponse(response, limit) {
  if (!response.ok) throw new Error("HTTP failure");
  // Playback controls can acknowledge success with 204 No Content.
  if (!response.body) return Buffer.alloc(0);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error("Response too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function readSong({ action, seconds, fetchImpl = fetch } = {}) {
  if (action !== undefined && !actions.has(action)) throw new Error("Unknown action");
  if (action === "seek-to" && (!Number.isFinite(seconds) || seconds < 0 || seconds > 604800)) throw new Error("Invalid seek position");
  const request = async (endpoint, method = "GET") => boundedResponse(await fetchImpl(API + endpoint, {
    method, signal: AbortSignal.timeout(2500), redirect: "error",
    ...(endpoint === "seek-to" ? { headers: { "content-type": "application/json" }, body: JSON.stringify({ seconds }) } : {}),
  }), 65536);
  let actionFailed = false;
  if (action) {
    try { await request(action, "POST"); }
    catch { actionFailed = true; }
  }
  // A timed-out control may have reached the player: refresh, but do not replay it.
  const song = normalizeSong(JSON.parse((await request("song-info")).toString("utf8")));
  return actionFailed ? { ...song, actionFailed: true } : song;
}

export async function cacheArtwork(url) {
  if (!safeArtwork(url)) return "";
  const dir = join(process.env.XDG_CACHE_HOME || join(homedir(), ".cache"), "youtube-music");
  const image = join(dir, "artwork");
  const key = createHash("sha256").update(url).digest("hex");
  try {
    if (await readFile(join(dir, "artwork.key"), "utf8") === key && (await readFile(image)).length) return image;
  } catch { /* First cover, or an expired cache. */ }
  const response = await fetch(url, { signal: AbortSignal.timeout(3000), redirect: "error" });
  if (!/^image\/(jpeg|png|webp)(;|$)/i.test(response.headers.get("content-type") || "")) return "";
  const bytes = await boundedResponse(response, 2 * 1024 * 1024);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(image, bytes, { mode: 0o600 });
  await writeFile(join(dir, "artwork.key"), key, { mode: 0o600 });
  return image;
}

export function openApp(platform = process.platform) {
  const launch = (command, args, fallback) => {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.on("error", () => { if (fallback) fallback(); });
    child.unref();
  };
  if (platform === "darwin") launch("open", ["-a", "YouTube Music"]);
  else launch("youtube-music", [], () => launch("omarchy", ["launch", "webapp", "https://music.youtube.com/"]));
}
