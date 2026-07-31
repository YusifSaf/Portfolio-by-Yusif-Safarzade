// Run this after gif-to-mp4.sh, before npm run build-projects.
//
// gif-to-mp4.sh converts files on disk (hero.gif -> hero.mp4) but has no idea
// meta.json exists - it never touches those references. This scans every
// images/<id>/meta.json and repoints any local hero/media reference that no
// longer exists on disk to the same-named .mp4/.webm sitting next to it, so
// the JSON catches up with whatever gif-to-mp4.sh actually converted.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { dirname, join, extname } from "path";
import { fileURLToPath } from "url";

const imagesDir = dirname(fileURLToPath(import.meta.url));
const isLocal = (src) => !/^https?:\/\//i.test(src);

function resolveConvertedName(dir, filename) {
  if (existsSync(join(dir, filename))) return filename; // untouched, nothing to do
  const base = filename.slice(0, filename.length - extname(filename).length);
  for (const ext of [".mp4", ".webm"]) {
    if (existsSync(join(dir, base + ext))) return base + ext;
  }
  return null; // genuinely missing - leave it, build-projects.js's own checks will surface it
}

let updatedRefs = 0;
let updatedFiles = 0;

for (const id of readdirSync(imagesDir)) {
  const dir = join(imagesDir, id);
  const metaPath = join(dir, "meta.json");
  if (!statSync(dir).isDirectory() || !existsSync(metaPath)) continue;

  const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
  let changed = false;

  if (isLocal(meta.hero)) {
    const resolved = resolveConvertedName(dir, meta.hero);
    if (resolved && resolved !== meta.hero) {
      console.log(`${id}: hero ${meta.hero} -> ${resolved}`);
      meta.hero = resolved;
      changed = true;
      updatedRefs++;
    }
  }

  for (const item of meta.media) {
    if (item.type === "image" && isLocal(item.src)) {
      const resolved = resolveConvertedName(dir, item.src);
      if (resolved && resolved !== item.src) {
        console.log(`${id}: media ${item.src} -> ${resolved}`);
        item.src = resolved;
        changed = true;
        updatedRefs++;
      }
    }
  }

  if (changed) {
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
    updatedFiles++;
  }
}

console.log(`\nUpdated ${updatedRefs} reference(s) across ${updatedFiles} meta.json file(s).`);
