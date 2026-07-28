// Flowing ambient-gradient background: a horizontal (left-to-right) linear
// gradient whose internal color stops slowly drift out of phase with each
// other, so the color wash appears to flow across the screen over time.
// Deliberately rendered at a tiny internal resolution and upscaled + blurred
// via CSS - browsers scale/blur images far more cheaply than a canvas can
// redraw blur at full resolution every frame, which is what keeps this
// affordable to run every frame.

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

function lerpColorHex(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// Internal stops between the 2 fixed end anchors (x=0 is always colorA,
// x=1 is always colorB) - these are what drift, giving the wash its motion.
const STOP_COUNT = 3;
// Internal render resolution - deliberately tiny; CSS upscales it to full
// screen. This one number is most of why this is cheap.
const RENDER_WIDTH = 160;

/**
 * @param {object} opts
 * @param {number} [opts.seed] - drives each stop's drift phase (reproducible per seed)
 * @param {number} [opts.speed] - flow speed multiplier (1 = default)
 * @param {number} [opts.scale] - how far each stop's color swings between colorA/colorB (1 = default)
 */
export function createGradientBackground({ seed = 0, speed = 1, scale = 1 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.zIndex = "-2"; // behind the three.js canvas (-1) and all page content
  canvas.style.filter = "blur(40px)";
  canvas.style.pointerEvents = "none";

  function resize() {
    canvas.width = RENDER_WIDTH;
    canvas.height = Math.max(1, Math.round(RENDER_WIDTH * (window.innerHeight / window.innerWidth)));
  }
  resize();
  window.addEventListener("resize", resize);

  const ctx = canvas.getContext("2d");
  const rand = mulberry32(seed);

  // Each stop sits at a fixed position along the gradient (evenly spaced) but
  // independently oscillates its OWN color mix between colorA/colorB, each at
  // its own slow frequency/phase - neighboring stops drift out of sync with
  // each other, which is what reads as a slow horizontal "flow" of color.
  const stops = Array.from({ length: STOP_COUNT }, (_, i) => ({
    pos: (i + 1) / (STOP_COUNT + 1),
    freq: 0.05 + rand() * 0.05,
    phase: rand() * Math.PI * 2,
  }));

  let colorA = "#000000";
  let colorB = "#000000";

  /** Update the two base colors this gradient blends between (any RGB hex). */
  function setColors(hexA, hexB) {
    colorA = hexA;
    colorB = hexB;
  }

  // The stops drift extremely slowly (see freq above), so redrawing every
  // single main-loop frame is wasted work - skipping frames here is visually
  // imperceptible but meaningfully cuts the per-frame drawing cost.
  const REDRAW_EVERY_N_FRAMES = 3;
  let frameCounter = 0;

  /** Call once per frame with a seconds-based timestamp. */
  function render(timeSec) {
    frameCounter++;
    if (frameCounter % REDRAW_EVERY_N_FRAMES !== 0) return;

    const w = canvas.width;
    const h = canvas.height;
    const t = timeSec * speed;

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, colorA);
    for (const s of stops) {
      // oscillates between roughly (0.5 - scale/2) and (0.5 + scale/2) mix
      const mix = 0.5 + 0.5 * scale * Math.sin(t * s.freq + s.phase);
      grad.addColorStop(s.pos, lerpColorHex(colorA, colorB, Math.max(0, Math.min(1, mix))));
    }
    grad.addColorStop(1, colorB);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Lets a caller skip building color strings for setColors() on frames that
  // render() is about to throw away anyway (see REDRAW_EVERY_N_FRAMES above).
  function willRedrawNextFrame() {
    return (frameCounter + 1) % REDRAW_EVERY_N_FRAMES === 0;
  }

  return { canvas, setColors, render, willRedrawNextFrame };
}
