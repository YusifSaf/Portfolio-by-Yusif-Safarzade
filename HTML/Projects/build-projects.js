// Regenerates projects.json from each project's own images/<id>/meta.json,
// in the order/grouping declared by categories.json. This is the one script
// you run (npm run build-projects) after adding, editing, or reordering a
// project - project.js and portfolio.html both just read the projects.json
// this produces, same as before this system existed.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = dirname(fileURLToPath(import.meta.url));
const categories = JSON.parse(readFileSync(join(root, "categories.json"), "utf-8"));
const ids = Object.values(categories).flat();

// Catches the easy-to-miss half of adding a project: a folder + meta.json
// with no matching entry in categories.json would otherwise just silently
// never appear on the site, with nothing telling you why.
const imagesDir = join(root, "images");
const idSet = new Set(ids);
for (const entry of readdirSync(imagesDir)) {
  if (!statSync(join(imagesDir, entry)).isDirectory() || idSet.has(entry)) continue;
  if (existsSync(join(imagesDir, entry, "meta.json"))) {
    console.error(`images/${entry}/meta.json exists but "${entry}" isn't listed in categories.json - it won't appear anywhere.`);
  }
}

const isLocal = (src) => !/^https?:\/\//i.test(src);

const projects = {};
for (const id of ids) {
  const metaPath = join(root, "images", id, "meta.json");
  if (!existsSync(metaPath)) {
    console.error(`Missing images/${id}/meta.json (listed in categories.json) - skipping.`);
    continue;
  }
  const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
  const prefix = `images/${id}/`;
  projects[id] = {
    ...meta,
    hero: isLocal(meta.hero) ? prefix + meta.hero : meta.hero,
    media: meta.media.map((item) => ({
      ...item,
      src: isLocal(item.src) ? prefix + item.src : item.src,
    })),
  };
}

writeFileSync(join(root, "projects.json"), JSON.stringify(projects, null, 2) + "\n");
console.log(`Wrote ${Object.keys(projects).length} projects to projects.json`);
