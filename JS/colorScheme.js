// Pure color-math module (no DOM/THREE dependency) - generates a full color
// scheme (background gradient stops + per-cube-face colors, for both the dark
// and light scroll phases) from a random base hue, structured through one of
// 3 real color-theory relationships (analogous / complementary / split-
// complementary) rather than picking hues freely. The background keeps its
// own shade/tint treatment (rich dark <-> soft pastel) since that's not what
// was asked to change; cube colors instead use a FIXED, moderate saturation
// and lightness - only hue varies - aiming for the gentle, evenly-lit,
// medium-pastel look of THREE.MeshNormalMaterial, rather than swinging
// between rich-dark and pastel-light extremes.

const CUBE_COUNT = 5;

const SCHEME_TYPES = ["analogous", "complementary", "split-complementary"];

// Given a base hue, returns the hue(s) that relationship type calls for.
// Complementary is a true 2-hue pair (not padded to 3) - a 3rd invented hue
// would dilute the actual complementary identity.
function huesForSchemeType(type, baseHue) {
  switch (type) {
    case "analogous":
      return [baseHue - 30, baseHue, baseHue + 30];
    case "complementary":
      return [baseHue, baseHue + 180];
    case "split-complementary":
      return [baseHue, baseHue + 150, baseHue + 210];
    default:
      return [baseHue];
  }
}

// Deterministic seeded PRNG (mulberry32) - same seed always gives the same
// scheme, which is what makes a "seed" parameter meaningful at all.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  const toHex = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Mixes a color toward black - preserves hue AND HSV saturation, since
// scaling all 3 channels by the same factor scales max/min together, so
// their ratio (= saturation) is unchanged. Used for the background only.
function shade(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

// Mixes a color toward white - a soft pastel "tint" of the same hue. Used
// for the background only.
function tint(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

// Background gradient stops - both share one muted hue, only brightness
// differs, so the flowing wash doesn't compete with the cubes' own hues.
const BG_SATURATION = 0.4;
const BG_DARK_SHADE = [0.88, 0.78];
const BG_LIGHT_TINT = [0.85, 0.75];

// Cube colors: fixed, moderate saturation/lightness (never pushed to a rich-
// dark shade or a washed-out pastel tint) - only hue changes between faces
// and between schemes. This is what gives the flat, gently-varied look of
// MeshNormalMaterial instead of the previous shade/tint extremes.
const CUBE_SATURATION = 0.5;
const CUBE_LIGHTNESS_ON_DARK_BG = 0.68; // a touch brighter - still stands out on a dark bg
const CUBE_LIGHTNESS_ON_LIGHT_BG = 0.52; // a touch dimmer - still stands out on a light bg
// Small per-cube variation on top of the above, so the same face across the 5
// cubes reads as "a close shade of one color" rather than 5 identical copies.
const CUBE_JITTER_RANGE = 0.1;

/**
 * @param {number} seed - any integer; same seed always picks the same scheme
 *   type, base hue, and per-cube shade variation.
 * @returns {{
 *   seed: number,
 *   paletteName: string,
 *   dark:  { bg: [string, string], faces: string[6][5] },
 *   light: { bg: [string, string], faces: string[6][5] },
 *   textDark: string,
 *   textLight: string,
 * }}
 */
export function generateColorScheme(seed = Date.now()) {
  const rand = mulberry32(seed);

  const schemeType = SCHEME_TYPES[Math.floor(rand() * SCHEME_TYPES.length)];
  const baseHue = rand() * 360;
  const cubeHues = huesForSchemeType(schemeType, baseHue);
  const bgAnchor = hslToHex(baseHue, BG_SATURATION, 0.5);

  const faceToPalette = Array.from({ length: 6 }, (_, f) => f % cubeHues.length);

  // Small deterministic per-cube jitter for each face, generated in a fixed
  // order off the SAME rand() stream so the whole scheme reproduces exactly
  // from one seed (no re-seeding sub-generators).
  const cubeJitter = faceToPalette.map(() =>
    Array.from({ length: CUBE_COUNT }, () => (rand() - 0.5) * CUBE_JITTER_RANGE),
  );

  function facesFor(baseLightness) {
    return faceToPalette.map((p, f) =>
      cubeJitter[f].map((j) => hslToHex(cubeHues[p], CUBE_SATURATION, Math.max(0, Math.min(1, baseLightness + j)))),
    );
  }

  return {
    seed,
    paletteName: schemeType,
    dark: {
      bg: BG_DARK_SHADE.map((amount) => shade(bgAnchor, amount)),
      faces: facesFor(CUBE_LIGHTNESS_ON_DARK_BG),
    },
    light: {
      bg: BG_LIGHT_TINT.map((amount) => tint(bgAnchor, amount)),
      faces: facesFor(CUBE_LIGHTNESS_ON_LIGHT_BG),
    },
    // Text stays pure white in the dark phase (plan requirement) and a dark,
    // in-scheme color in the light phase instead of flat black - reuses the
    // bg's own darkest shade so it's guaranteed to match the scheme.
    textDark: "#ffffff",
    textLight: shade(bgAnchor, BG_DARK_SHADE[0]),
  };
}

/** Look up one cube's one face's color for the given phase ("dark"|"light"). */
export function getFaceColor(scheme, phase, faceIndex, cubeIndex) {
  return scheme[phase].faces[faceIndex][cubeIndex];
}
