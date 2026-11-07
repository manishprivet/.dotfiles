import { execFileSync } from "node:child_process";
import { cacheArtwork, openApp, readSong } from "./client.mjs";

const name = process.env.NAME || "music";
const item = name.endsWith("-artwork") ? name.slice(0, -8) : name;
const set = (target, properties) => execFileSync("sketchybar", ["--set", target,
  ...Object.entries(properties).map(([key, value]) => `${key}=${value}`)], { timeout: 3000 });

if (process.env.BUTTON === "other") openApp();
let song;
try {
  const action = { left: "toggle-play", right: "next" }[process.env.BUTTON];
  song = await readSong({ action });
} catch { song = { available: false }; }
set(item, { label: song.available ? song.label : "YouTube Music", icon: song.available && !song.isPaused ? "􁁒" : "􀊄", drawing: "on" });
let artwork = "";
if (song.available) {
  try { artwork = await cacheArtwork(song.imageSrc); } catch { /* Keep controls usable without cover art. */ }
}
set(`${item}-artwork`, { "background.image": artwork, drawing: artwork ? "on" : "off" });
