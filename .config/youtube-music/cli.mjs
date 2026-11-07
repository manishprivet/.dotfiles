import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { cacheArtwork, openApp, readSong } from "./client.mjs";

const action = process.argv[2];
if (action === "open") openApp();
else {
  try {
    if (action === "artwork") {
      const imageSrc = process.argv[3];
      const path = await cacheArtwork(imageSrc);
      const version = createHash("sha256").update(imageSrc || "").digest("hex");
      console.log(JSON.stringify({ ok: true, imageSrc, artwork: path ? `${pathToFileURL(path).href}?v=${version}` : "" }));
    } else {
      if (action && !["status", "toggle-play", "previous", "next", "seek-to"].includes(action)) throw new Error("Unknown action");
      const seconds = action === "seek-to" && process.argv[3] !== undefined ? Number(process.argv[3]) : undefined;
      console.log(JSON.stringify(await readSong({ action: action === "status" ? undefined : action, seconds })));
    }
  } catch {
    console.log(JSON.stringify({ ok: false, available: false, error: "unavailable" }));
    process.exitCode = 1;
  }
}
