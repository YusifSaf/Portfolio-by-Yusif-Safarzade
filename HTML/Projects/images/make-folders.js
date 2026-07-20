const fs = require("fs");
const path = require("path");

const folders = [
  "audio-visualizer",
  "pitch-detector",
  "midi-visualizer",
  "i-can-see-you",
  "hyper-holes",
  "osmosis",
  "rvk",
  "prema",
  "physical-digital",
];

const basePath = __dirname;

folders.forEach((name) => {
  const dir = path.join(basePath, name);
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created: ${dir}`);
});
