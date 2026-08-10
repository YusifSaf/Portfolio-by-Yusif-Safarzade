// three-scene.js
// Mirrors behavior of uploaded p5 script.js
// * means not sure, or possible cause of problems

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { gsap } from "//cdn.skypack.dev/gsap?min";
import { generateColorScheme } from "./colorScheme.js";
import { createGradientBackground } from "./gradientBackground.js";

// Variables
let snap = 0;
// Per-box rotation stagger - the "spiral" spread. 45 gives a 180deg total fan
// across the 5 boxes (0,45,90,135,180 relative), the widest useful spiral.
const rotAmount = 22.5;
const distance = 280;
let currentScroll = 0;
let y = 0;
let boxesReady = false;
const title = document.getElementById("title");
let titleText = "";
let hoverWasSet = false;
const yPositionOnHover = 60;
const scaleOnHover = 1.3;
let previousBox = null;
let titleAnimationFired = false; //State variable for firing title fade animation just once
let currentlyHovering = false;
let previousTitleText = ""; //Tracks last shown scroll-phase text so we only fade on change
// Snapshot of the currently-hovered box's rotation, taken the instant hover starts.
// Hover tweens apply a small OFFSET on top of this base and restore to this exact
// value on hover-exit, instead of ever tweening to/from a hardcoded absolute angle -
// the scroll formula can leave a box at any raw rotation, so there is no fixed
// "default" angle that's correct for every scroll position.
let hoverBaseRotationDeg = null;
// Set right when a clicked box starts its click-spin (below), so a stray
// mousemove/mousedown during the spin+navigate window can't start a second
// tween or a second navigation. Reset on pageshow, since a bfcache restore
// would otherwise resurrect this as permanently-true on the page navigated FROM.
let isNavigatingAway = false;

// Tune the click-to-navigate spin here (plays once when a box is clicked to
// switch pages, before the page actually navigates):
const CLICK_SPIN_DURATION = 0.5; // seconds, total animation time
const CLICK_SPIN_Y_DEG = 270; // full turns on the Y axis
// How far X/Z swing out (and back) mid-spin, for the "off-axis"/natural wobble.
const CLICK_SPIN_WOBBLE_DEG = { x: 15, z: -12 };

//Audio References
let audioPlayed = false;
// const hoverAudio = document.querySelector('.hover-audio');
// const BGAudio = document.querySelector('.bg-audio');
var BGAudio = new Howl({
  src: ["Audio/BGAudio.mp3"],
  volume: 0.1,
  loop: true,
});
var hoverAudio = new Howl({
  src: ["Audio/1testHoverAudio.mp3"],
  volume: 1,
});
var clickAudio = new Howl({
  src: ["Audio/0testHoverAudio.mp3"],
  volume: 1,
});
let scrollToVolume = 0;

// Let us own scroll position on load/back-forward nav instead of the browser
// silently restoring it (the previous source of the reload/back scroll-jump bug)
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Initialize Lenis and adjust gsap
const lenis = new Lenis({
  autoRaf: true,
  lerp: 0.05, // adjust the smoothness of the scroll
  wheelMultiplier: 0.1, // adjust the speed/sensitivity of the scroll
});
gsap.ticker.lagSmoothing(0);

// pageshow fires on normal loads AND on back/forward-cache restores (unlike
// "load", which only fires once) - resetting here on every occurrence is what
// keeps reload and browser-back navigation landing at a consistent position
window.addEventListener("pageshow", () => {
  // On a bfcache restore (persisted:true) this is the SAME JS heap as when we
  // navigated away - any hover tilt/tween/stopped-lenis state from that moment
  // is still sitting there untouched, which is what caused the freeze. Forcing
  // a full reset here covers that path; on a genuinely fresh load it's a no-op
  // since everything is already at its initial values.
  resetAllBoxRotations();
  isNavigatingAway = false;
  lenis.start();
  lenis.scrollTo(0, { immediate: true });
  currentScroll = 0;
});

lenis.on("scroll", (e) => {
  currentScroll = e.scroll;
});

// Click-to-enter splash: gates audio behind one deliberate click (browsers
// block autoplay-with-sound regardless) and holds scroll/animation until then.
// Skipped entirely when arriving via ?skipIntro=1 (Portfolio's back button,
// the only page whose back-nav is a fresh load instead of a bfcache restore -
// see HTML/portfolio.html) - that link click is itself the user gesture, so
// audio autoplay is still gesture-backed even though this document never
// shows the splash.
const splash = document.getElementById("splash");
lenis.stop();

function enterSite() {
  BGAudio.play();
  lenis.start();
  gsap.to(splash, {
    duration: 0.6,
    opacity: 0,
    onComplete: () => splash.remove(),
  });
}

const skipIntro = new URLSearchParams(window.location.search).get("skipIntro");
if (skipIntro) {
  // Strip the flag from the URL so a later manual reload of this page shows
  // the splash normally instead of skipping it forever.
  history.replaceState(null, "", window.location.pathname);
  enterSite();
} else {
  splash.addEventListener("click", enterSite, { once: true });
}

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//Extra graphics. May decrease performance *
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.phisicallyCorrectLights = true;
renderer.tonMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5;
//document.querySelector(".model").appendChild(renderer.domElement) *

// Put canvas fixed behind everything (CSS already sets z-index in style.css)
// Append renderer DOM element to body
document.body.appendChild(renderer.domElement); //*

// Setup Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
camera.position.set(-1000, 0, 0);
camera.lookAt(0, 0, 0);

// Random scheme every reload by default, but ?seed=1234 in the URL pins it to
// a specific scheme - bookmark a look you like, or reproduce one for debugging.
function resolveColorSeed() {
  const urlSeed = new URLSearchParams(window.location.search).get("seed");
  if (urlSeed !== null && urlSeed !== "" && !Number.isNaN(Number(urlSeed))) {
    return Number(urlSeed);
  }
  return Math.floor(Math.random() * 1_000_000_000);
}
const colorSeed = resolveColorSeed();
console.log(`Color scheme seed: ${colorSeed} (revisit with ?seed=${colorSeed} in the URL)`);
const colorScheme = generateColorScheme(colorSeed);

// speed multiplies how fast the color stops drift (1 = original pace) - bump
// up/down here to tune the flow rate. Same seed as the color scheme, so the
// flow's drift pattern is reproducible together with the rest of the look.
const gradientBg = createGradientBackground({ seed: colorSeed, speed: 1.8 });
document.body.appendChild(gradientBg.canvas);

// Setup Boxes
const boxes = [];
const boxGeometry = new THREE.BoxGeometry(150, 150, 150);
// Real per-face colors (replacing the old MeshNormalMaterial illusion, which
// only faked distinct-looking faces via each face's normal direction).
// MeshBasicMaterial is unlit/flat-shaded - cheap to render (no lighting math)
// and makes the dark->light color transition a plain color lerp with no
// lighting interaction to account for. Geometry is still shared across all 5
// cubes; only these small material objects are duplicated per cube per face.
const boxMaterials = []; // boxMaterials[cubeIndex][faceIndex]

for (let i = 0; i < 5; i++) {
  const materials = Array.from(
    { length: 6 },
    (_, face) => new THREE.MeshBasicMaterial({ color: colorScheme.dark.faces[face][i] }),
  );
  boxMaterials.push(materials);
  const mesh = new THREE.Mesh(boxGeometry, materials);
  mesh.name = i;
  mesh.position.x = distance * i - distance * 2;
  scene.add(mesh);
  boxes.push(mesh);
}

// Precomputed THREE.Color endpoints for the dark<->light transition - built
// once here (not per frame) so applyColorPhase() below only ever does cheap
// numeric lerps, never string/hex parsing, every frame.
const boxDarkColors = boxMaterials.map((materials, cube) =>
  materials.map((_, face) => new THREE.Color(colorScheme.dark.faces[face][cube])),
);
const boxLightColors = boxMaterials.map((materials, cube) =>
  materials.map((_, face) => new THREE.Color(colorScheme.light.faces[face][cube])),
);
const bgDarkColors = colorScheme.dark.bg.map((hex) => new THREE.Color(hex));
const bgLightColors = colorScheme.light.bg.map((hex) => new THREE.Color(hex));
const bgLerpScratch = [new THREE.Color(), new THREE.Color()]; // reused every frame, no per-frame allocation

// Every ROTATION_STEP_DEG of a cube's own X rotation, its face colors advance
// by one slot in the fixed 6-slot palette - so as a cube spins, its faces
// gradually pick up their neighbor's color instead of jumping straight to it.
// The cycle position is derived straight from the cube's current rotation (not
// a separate running counter), so it's correct whether the scroll is moving
// forward or backward and needs no extra per-frame state.
const ROTATION_STEP_DEG = 90;
const FACE_COUNT = 6;
// Reused every frame per face (2 lerps: dark<->light phase, then slot<->next
// slot) - avoids allocating 2 THREE.Color per face per frame.
const faceLerpScratchA = new THREE.Color();
const faceLerpScratchB = new THREE.Color();

// t: 0 = fully dark-phase colors, 1 = fully light-phase colors. Called from
// every scroll branch below (including the frozen buffers, at a fixed 0 or 1)
// so cube faces and the flowing background always match the current phase.
function applyColorPhase(t) {
  for (let cube = 0; cube < boxMaterials.length; cube++) {
    const deg = THREE.MathUtils.radToDeg(boxes[cube].rotation.x);
    const cyclePos = deg / ROTATION_STEP_DEG;
    for (let face = 0; face < boxMaterials[cube].length; face++) {
      const pos = cyclePos + face;
      const slotA = ((Math.floor(pos) % FACE_COUNT) + FACE_COUNT) % FACE_COUNT;
      const slotB = (slotA + 1) % FACE_COUNT;
      const frac = pos - Math.floor(pos);
      faceLerpScratchA.lerpColors(boxDarkColors[cube][slotA], boxLightColors[cube][slotA], t);
      faceLerpScratchB.lerpColors(boxDarkColors[cube][slotB], boxLightColors[cube][slotB], t);
      boxMaterials[cube][face].color.lerpColors(faceLerpScratchA, faceLerpScratchB, frac);
    }
  }
  // getHexString() formats a fresh string each call - skip it on frames whose
  // colors gradientBg.render() won't actually use (see REDRAW_EVERY_N_FRAMES
  // in gradientBackground.js), rather than building 2 strings every frame.
  if (gradientBg.willRedrawNextFrame()) {
    bgLerpScratch[0].lerpColors(bgDarkColors[0], bgLightColors[0], t);
    bgLerpScratch[1].lerpColors(bgDarkColors[1], bgLightColors[1], t);
    gradientBg.setColors(
      `#${bgLerpScratch[0].getHexString()}`,
      `#${bgLerpScratch[1].getHexString()}`,
    );
    // document.body's own background sits behind the gradient canvas and is
    // normally fully hidden by it - it only matters as a fallback for what the
    // canvas's CSS blur reveals right at its own edge. Kept in the scheme's
    // actual hue now (previously a flat grayscale left over from before the
    // color system existed, which didn't match the gradient's hue at all) and
    // updated on the same throttle as the canvas itself, instead of every
    // single frame regardless of whether the value even changed.
    document.body.style.background = `#${bgLerpScratch[0].getHexString()}`;
  }
}

// At the dark freeze the camera sits at +X, so the highest-index box is the one
// closest to it (the visually prominent "front" cube). We slide the WHOLE spiral
// by one shared amount so only this front cube lands exactly on a clean 90deg
// multiple - the spacing between cubes is untouched, so the spiral keeps its full
// width. This replaces the old per-cube pull that distorted/collapsed the spiral.
// At rotAmount=45 the front cube already sits on a clean angle, so this shift is 0.
const FRONT_BOX = boxes.length - 1;
const FRONT_LOCK_OFFSET = nearestRightAngleOffset(rotAmount * FRONT_BOX);

// Keep scene ambient-ish so normals show nicely
const ambient = new THREE.AmbientLight(0xffffff, 0.0); // minimal; MeshNormalMaterial doesn't need lighting
scene.add(ambient);

// Make sure canvas is full-screen and fixed like original CSS intended *
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "-1";

// Main render loop
function render() {
  // replicate the original modulo scroll behavior
  // const scrollPos = window.scrollY % 2500;

  const scrollPos = currentScroll % 300; // we used %300 instead of forLoop
  let scrollToRotation = 0;

  // Jav's Method
  if (scrollPos <= 100) {
    y = (90 * scrollPos) / 100;
    scrollToRotation = map(scrollPos, 0, 100, y - 90, y);

    snap = map(scrollToRotation, y - 90, y, 0, rotAmount);
    const camX = map(scrollToRotation, y - 90, y, -1000, 0);
    const camZ = map(scrollToRotation, y - 90, y, 0, 1000);
    camera.position.set(camX, 0, camZ);
    camera.lookAt(0, 0, 0);

    const bg = Math.round(map(scrollToRotation, y - 90, y, 0, 255));

    // Applies the shared front-cube shift at full strength at the very start of
    // this phase (matching the dark freeze pose behind us) and fades it out by
    // the end, where all boxes converge to a single aligned angle. It's ONE
    // constant added to every box, so the spiral spacing is never distorted.
    const lockWeight1 = map(scrollToRotation, y - 90, y, 1, 0);
    for (let i = 0; i < boxes.length; i++) {
      const rawDeg = rotAmount * i - snap * i + map(scrollToRotation, 0, 180, 0, 360);
      const deg = rawDeg + FRONT_LOCK_OFFSET * lockWeight1;
      boxes[i].rotation.x = THREE.MathUtils.degToRad(deg);
    }
    // Called after rotation.x is set above, so the color-cycling offset in
    // applyColorPhase reads this frame's rotation, not the previous frame's.
    applyColorPhase(bg / 255);

    boxesReady = false;
    hoverWasSet = false; //So each loop it show the "Press to Interact."

    if ((scrollPos >= 0) & (scrollPos < 30)) {
      titleText = "Scroll to Interact.";
      title.style.color = `rgb(${255},${255},${255})`;
    } else {
      titleText = "";
    }

    scrollToVolume = map(scrollPos, 0, 100, 0.1, 1);
  }

  if ((scrollPos > 100) & (scrollPos <= 150)) {
    y = 90;
    applyColorPhase(1);

    boxesReady = true;
    if (!hoverWasSet) {
      titleText = "Press to Interact.";
    }
    title.style.color = colorScheme.textLight;
  }

  if ((scrollPos > 150) & (scrollPos <= 250)) {
    y = 90 + (90 * scrollPos) / 100;
    scrollToRotation = map(scrollPos, 150, 250, y - 90, y);

    // Cancels the stagger at the START of this phase (matching the aligned
    // pose the boxes are frozen in through the 100-150 buffer) and lets it
    // grow back out by the end, so exiting the buffer is seamless and the
    // ending pose is a staggered "spiral" - see the -90 offset below for why
    // that spiral is made to land exactly on branch 1's own starting pattern.
    snap = map(scrollToRotation, y - 90, y, rotAmount, 0);
    const camX = map(scrollToRotation, y - 90, y, 0, 1000);
    const camZ = map(scrollToRotation, y - 90, y, 1000, 0);
    camera.position.set(camX, 0, camZ);
    camera.lookAt(0, 0, 0);

    const bg = Math.round(map(scrollToRotation, y - 90, y, 255, 0));

    // Mirror of branch 1: no shift at the start (continuous with the aligned
    // light-buffer pose) fading up to the full shared shift by the dark freeze,
    // so the front cube lands exactly on a clean angle there.
    const lockWeight2 = map(scrollToRotation, y - 90, y, 0, 1);
    for (let i = 0; i < boxes.length; i++) {
      // The -90 aligns this phase's continuously-accumulating base rotation with
      // branch 1's own base at scrollPos 0 (they drift apart by exactly 90deg
      // otherwise, an artifact of the two phases' scrollToRotation ranges) - with
      // it, this phase starts exactly matching the incoming aligned pose and ends
      // exactly matching branch 1's own starting spiral, so the dark->light->dark
      // loop has no visible seam. Assigns directly to boxes[i] (not reversed) so
      // the spiral's direction matches branch 1's rather than mirroring it.
      const rawDeg = rotAmount * i - snap * i + map(scrollToRotation, 0, 180, 0, 360) - 90;
      const deg = rawDeg + FRONT_LOCK_OFFSET * lockWeight2;
      boxes[i].rotation.x = THREE.MathUtils.degToRad(deg);
    }
    // Called after rotation.x is set above, so the color-cycling offset in
    // applyColorPhase reads this frame's rotation, not the previous frame's.
    applyColorPhase(bg / 255);

    boxesReady = false;
    titleText = "";

    scrollToVolume = map(scrollPos, 150, 250, 1, 0.1);
  }

  if ((scrollPos > 250) & (scrollPos < 300)) {
    y = 180;
    applyColorPhase(0);

    boxesReady = false;
  }
  // console.log(scrollPos);
  // console.log(boxesReady)

  resetBoxHover();
  //Cross-fade the title text on change instead of swapping it abruptly
  if (titleText !== previousTitleText) {
    previousTitleText = titleText;
    gsap.to(title, {
      duration: 0.3,
      opacity: 0,
      onComplete: () => {
        title.textContent = titleText;
        gsap.to(title, { duration: 0.3, opacity: 1 });
      },
    });
  }

  //This was set to eliminate the bug where you could hover and then scroll, leaving the cube in a messed up pose
  if (currentlyHovering) {
    lenis.stop();
  } else {
    lenis.start();
  }

  //To dynamically control BGAudio volume
  BGAudio.volume(scrollToVolume);

  gradientBg.render(performance.now() / 1000);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();

// Functions
// Rotation.y/z are ONLY ever written by hover tweens (render()'s scroll formula
// only ever touches rotation.x) - so they're the one piece of state that never
// self-corrects. Normally the mousemove hover-exit handles clearing them, but
// that requires an actual mousemove event to fire; clicking a box to navigate
// away, or the Home button's scrollTo, both leave the page with no guarantee of
// a further mousemove, so the tilt is left standing. This clears it directly
// wherever hover state needs to be force-reset instead of relying on that event.
function resetAllBoxRotations() {
  for (let i = 0; i < boxes.length; i++) {
    gsap.killTweensOf(boxes[i].rotation);
    gsap.killTweensOf(boxes[i].scale);
    boxes[i].rotation.y = 0;
    boxes[i].rotation.z = 0;
    boxes[i].scale.set(1, 1, 1);
    boxes[i].position.y = 0;
  }
  hoverBaseRotationDeg = null;
  previousBox = null;
  currentlyHovering = false;
  titleAnimationFired = false;
  hoverWasSet = false;
}

//This function is constntly running in update to solve the bug with box's hover size staying the same if u hover on it and scroll past the boxesReady poing
function resetBoxHover() {
  if (!boxesReady) {
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].position.y = 0;
      boxes[i].scale.set(1, 1, 1);
    }
  }
}

// Plays the click-to-navigate spin on `box` (a full Y spin plus a small X/Z
// wobble that swings out and back within the same duration, so the box lands
// EXACTLY where it started), then calls onComplete. This only runs while
// boxesReady is true (the only time a click can navigate), and render()'s
// scroll formula never writes rotation.x during that window either - so it's
// safe to tween all three axes here without fighting the per-frame scroll code.
function playClickSpin(box, onComplete) {
  const startX = box.rotation.x;
  const startY = box.rotation.y;
  const startZ = box.rotation.z;
  const wobbleX = THREE.MathUtils.degToRad(CLICK_SPIN_WOBBLE_DEG.x);
  const wobbleZ = THREE.MathUtils.degToRad(CLICK_SPIN_WOBBLE_DEG.z);

  const tl = gsap.timeline({
    onComplete: () => {
      // Force an exact landing - guards against any float drift from the
      // tween so the box is provably back at its pre-spin rotation.
      box.rotation.set(startX, startY, startZ);
      onComplete();
    },
  });
  tl.to(
    box.rotation,
    {
      duration: CLICK_SPIN_DURATION,
      ease: "power1.inOut",
      y: startY + THREE.MathUtils.degToRad(CLICK_SPIN_Y_DEG),
    },
    0,
  );
  tl.to(
    box.rotation,
    {
      duration: CLICK_SPIN_DURATION / 2,
      ease: "sine.inOut",
      x: startX + wobbleX,
      z: startZ + wobbleZ,
      yoyo: true,
      repeat: 1,
    },
    0,
  );
}

// Shared by every box whose click switches to another page: play the spin,
// THEN reset hover state and navigate - never before the spin finishes.
function navigateWithSpin(box, url) {
  isNavigatingAway = true;
  playClickSpin(box, () => {
    resetAllBoxRotations();
    window.open(url, "_self");
  });
}

// Hover and Press Raycaster Setup. MOUSE LOGIC
const raycaster = new THREE.Raycaster();

// Small relative hover tilt per box (x,y,z in degrees), applied ON TOP OF
// whatever rotation the box currently has - never as an absolute target.
// Module-scoped (not rebuilt per mousemove) since it never changes.
const HOVER_TILT_DEG = {
  0: { x: 12, y: 10, z: -8 },
  1: { x: 0, y: 45, z: 18 },
  2: { x: 25, y: 10, z: -9 },
  3: { x: -18, y: 10, z: 11 },
  4: { x: 14, y: -24, z: -3 },
};

// Module-scoped (not redefined per mousemove) - only closes over the
// module-level hoverBaseRotationDeg, never anything per-call.
function restoreBoxRotation(box) {
  if (!hoverBaseRotationDeg) return;
  gsap.to(box.rotation, {
    duration: 0.5,
    ease: "power4.out",
    x: THREE.MathUtils.degToRad(hoverBaseRotationDeg.x),
    y: THREE.MathUtils.degToRad(hoverBaseRotationDeg.y),
    z: THREE.MathUtils.degToRad(hoverBaseRotationDeg.z),
  });
}

document.addEventListener("mousemove", OnMouseMove);
document.addEventListener("mousedown", OnMouseDown);
function OnMouseMove(event) {
  if (isNavigatingAway) return; // don't fight the click-spin tween mid-navigation
  const coords = new THREE.Vector2(
    (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    -((event.clientY / renderer.domElement.clientHeight) * 2 - 1),
  );

  raycaster.setFromCamera(coords, camera);

  const intersections = raycaster.intersectObjects(scene.children, true);

  if (intersections.length > 0) {
    hoverWasSet = true;
    const selectedObjectIndex = intersections[0].object.name;
    //Reset when switching to another box
    if (previousBox !== null && previousBox !== selectedObjectIndex) {
      gsap.to(boxes[previousBox].scale, { duration: 0.5, ease: "power4.out", x: 1, y: 1, z: 1 });
      if (boxesReady) {
        restoreBoxRotation(boxes[previousBox]);
      }
    }

    //When select is available
    if (boxesReady) {
      // console.log(`Hovered on ${intersections[0].object.name}`);
      currentlyHovering = true;
      if (!audioPlayed) {
        hoverAudio.play();
        audioPlayed = true;
      }

      // Snapshot the base rotation only when hover is landing on a NEW box, or
      // we don't have one yet (previousBox can already equal this box from an
      // incidental hover while boxesReady was still false, e.g. during the
      // splash screen - that never captured a base, so it'd otherwise be
      // mistaken for "already hovering this box, nothing to do" and skipped).
      // Never re-capture on every tick of an ALREADY-ready hover though, or
      // we'd capture a mid-tween value and ratchet the base each frame.
      if (previousBox !== selectedObjectIndex || !hoverBaseRotationDeg) {
        const target = boxes[selectedObjectIndex];
        hoverBaseRotationDeg = {
          x: THREE.MathUtils.radToDeg(target.rotation.x),
          y: THREE.MathUtils.radToDeg(target.rotation.y),
          z: THREE.MathUtils.radToDeg(target.rotation.z),
        };
      }

      const titles = { 0: "Home.", 1: "Portfolio.", 2: "Resume.", 3: "About.", 4: "Contacts." };
      if (titles[selectedObjectIndex] !== undefined) {
        titleText = titles[selectedObjectIndex];
        if (!titleAnimationFired) {
          gsap.fromTo(
            ".heading",
            { opacity: 0 },
            { duration: 0.5, ease: "power4.out", opacity: 1 },
          );
        }
        titleAnimationFired = true;

        const currentBox = boxes[selectedObjectIndex];
        const tilt = HOVER_TILT_DEG[selectedObjectIndex];
        gsap.to(currentBox.scale, {
          duration: 0.5,
          ease: "power4.out",
          x: scaleOnHover,
          y: scaleOnHover,
          z: scaleOnHover,
        });
        gsap.to(currentBox.rotation, {
          duration: 0.5,
          ease: "power4.out",
          x: THREE.MathUtils.degToRad(hoverBaseRotationDeg.x + tilt.x),
          y: THREE.MathUtils.degToRad(hoverBaseRotationDeg.y + tilt.y),
          z: THREE.MathUtils.degToRad(hoverBaseRotationDeg.z + tilt.z),
        });
      }
    }

    previousBox = selectedObjectIndex;
  }
  if (intersections.length == 0) {
    currentlyHovering = false;
    if (audioPlayed) {
      hoverAudio.pause();
      audioPlayed = false;
    }
    //Restore default box position and scale when not hovering over any.
    for (let i = 0; i < boxes.length; i++) {
      gsap.to(boxes[i].scale, { duration: 0.5, ease: "power4.out", x: 1, y: 1, z: 1 });
    }
    // Only the box that was actually hovered needs its rotation restored -
    // and only to ITS OWN captured base, since that's the one true "correct"
    // angle for wherever the scroll position currently is.
    if (previousBox !== null && boxesReady) {
      restoreBoxRotation(boxes[previousBox]);
    }
    hoverBaseRotationDeg = null;
    titleAnimationFired = false;
    previousBox = null;
  }
  if (intersections.length == 0 && boxesReady) {
    titleText = ""; //Remove text when no hover and no hint
  }
}

function OnMouseDown(event) {
  if (isNavigatingAway) return; // ignore re-clicks while a spin+navigation is already in flight
  const coords = new THREE.Vector2(
    (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    -((event.clientY / renderer.domElement.clientHeight) * 2 - 1),
  );

  raycaster.setFromCamera(coords, camera);

  const intersections = raycaster.intersectObjects(scene.children, true);

  if (intersections.length > 0) {
    const selectedObjectIndex = intersections[0].object.name;
    if (boxesReady) {
      // console.log(`Clicked on ${intersections[0].object.name}`);
      switch (selectedObjectIndex) {
        case 0: {
          clickAudio.play();
          // Box0 is necessarily still hovered (and tilted) right at the moment
          // of this click, with no further mousemove guaranteed to ever fire to
          // clean that up - reset it directly instead of leaving it frozen.
          resetAllBoxRotations();
          // render()'s per-frame "if (currentlyHovering) lenis.stop()" guard
          // (a few lines below) leaves Lenis stopped, since we're necessarily
          // still hovering box 0 right at the moment of this click - flipping
          // the flag alone doesn't take effect until next frame, so scrollTo
          // would get started-then-immediately-cancelled. Explicitly starting
          // it here first is what makes the scroll-to-top actually happen.
          lenis.start();
          // Rewind only to the start of the CURRENT dark-light-dark cycle
          // (scroll is unbounded and just wraps via %300), not all the way to
          // absolute 0 - otherwise after a lot of scrolling this animates over
          // the entire scroll history at once, spinning through several full
          // rotations in the same fixed 1.2s duration.
          const cycleStart = Math.floor(currentScroll / 300) * 300;
          lenis.scrollTo(cycleStart, { duration: 1.2 });
          break;
        }
        case 1:
          clickAudio.play();
          // Spins the box first, then resets hover state and navigates - see
          // navigateWithSpin/playClickSpin above. The reset-before-navigating
          // is still what protects a bfcache restore from showing this box
          // frozen mid-tilt; it just now happens after the spin finishes.
          navigateWithSpin(boxes[selectedObjectIndex], "HTML/portfolio.html");
          break;
        case 2:
          clickAudio.play();
          navigateWithSpin(boxes[selectedObjectIndex], "HTML/resume.html");
          break;
        case 3:
          clickAudio.play();
          navigateWithSpin(boxes[selectedObjectIndex], "HTML/about.html");
          break;
        case 4:
          clickAudio.play();
          navigateWithSpin(boxes[selectedObjectIndex], "HTML/contacts.html");
          break;
        default:
          break;
      }
    }
  }
}

// function fadeVolumeUp(){
//   BGAudio.fade(0.1, 1, 500)
// }

// function fadeVolumeDown(){
//   BGAudio.fade(1, 0.1, 500)
// }

// Helper Functions
function map(v, a, b, c, d) {
  const t = (v - a) / (b - a);
  return c + t * (d - c);
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
// How far `deg` is from the nearest multiple of 90 - used to pull boxes
// onto clean right angles as they approach the dark/light freeze points.
function nearestRightAngleOffset(deg) {
  return Math.round(deg / 90) * 90 - deg;
}

// Resize handler
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
