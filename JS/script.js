// three-scene.js
// Mirrors behavior of uploaded p5 script.js
// * means not sure, or possible cause of problems

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { gsap } from "//cdn.skypack.dev/gsap?min";

// Variables
let snap = 0;
const rotAmount = 25;
// How hard boxes get pulled toward the nearest right angle in the dark buffer:
// 1 = exact lock (collapses neighboring boxes onto the same angle, since their
// 25deg spacing spans more than one 90deg slot); 0 = no pull, full spiral.
// 0.5 keeps every box distinct while landing much closer to a right angle.
const LOCK_STRENGTH = 0.1;
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
  lenis.start();
  lenis.scrollTo(0, { immediate: true });
  currentScroll = 0;
});

lenis.on("scroll", (e) => {
  currentScroll = e.scroll;
});

// Click-to-enter splash: gates audio behind one deliberate click (browsers
// block autoplay-with-sound regardless) and holds scroll/animation until then
const splash = document.getElementById("splash");
lenis.stop();
splash.addEventListener(
  "click",
  () => {
    BGAudio.play();
    lenis.start();
    gsap.to(splash, {
      duration: 0.6,
      opacity: 0,
      onComplete: () => splash.remove(),
    });
  },
  { once: true },
);

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

// Setup Boxes
const boxes = [];
const boxGeometry = new THREE.BoxGeometry(150, 150, 150);
const material = new THREE.MeshNormalMaterial(); // closest to p5 normalMaterial()

for (let i = 0; i < 5; i++) {
  const mesh = new THREE.Mesh(boxGeometry, material);
  mesh.name = i;
  mesh.position.x = distance * i - distance * 2;
  scene.add(mesh);
  boxes.push(mesh);
}

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
    document.body.style.background = `rgb(${bg},${bg},${bg})`;

    // Pulls each box onto the nearest right angle at the very start of this
    // phase (matching the dark buffer's locked pose behind us) and fades that
    // pull out by the end, where the boxes need to be exactly aligned at 0 -
    // see the matching pull in branch 2 below for why both ends need this.
    const lockWeight1 = map(scrollToRotation, y - 90, y, LOCK_STRENGTH, 0);
    for (let i = 0; i < boxes.length; i++) {
      const rawDeg = rotAmount * i - snap * i + map(scrollToRotation, 0, 180, 0, 360);
      // The lock target is derived from `rotAmount * i` (fixed per box), NOT
      // from rawDeg itself - rawDeg drifts continuously through the phase, so
      // recomputing "nearest 90" from it would flip targets mid-transition
      // and cause a visible snap. Using a fixed target keeps the pull smooth.
      const deg = rawDeg + nearestRightAngleOffset(rotAmount * i) * lockWeight1;
      boxes[i].rotation.x = THREE.MathUtils.degToRad(deg);
    }

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
    document.body.style.background = `rgba(255, 255, 255)`;

    boxesReady = true;
    if (!hoverWasSet) {
      titleText = "Press to Interact.";
    }
    title.style.color = `rgb(${0},${0},${0})`;
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
    document.body.style.background = `rgb(${bg},${bg},${bg})`;

    // Same idea as branch 1's lockWeight but mirrored: no pull at the start
    // (continuous with the aligned buffer-1 pose), full pull by the end so
    // each box lands exactly on a 90deg multiple instead of the raw staggered
    // value - which is what was landing in the 250-300 dark buffer before.
    const lockWeight2 = map(scrollToRotation, y - 90, y, 0, LOCK_STRENGTH);
    for (let i = 0; i < boxes.length; i++) {
      // The -90 aligns this phase's continuously-accumulating base rotation
      // with branch 1's own base at scrollPos 0 (they drift apart by exactly
      // 90deg otherwise, an artifact of the two phases' y/scrollToRotation
      // ranges) - with it, this phase starts exactly matching the incoming
      // frozen buffer pose and (before the lock pull) would end matching
      // branch 1's own starting stagger; the lock pull then resolves that
      // stagger onto clean right angles instead, and branch 1's matching
      // pull keeps the next cycle's start in sync so the loop stays seamless.
      // Also assigns directly to boxes[i] (not reversed) so the stagger's
      // direction/slope across boxes matches branch 1's rather than mirroring it.
      const rawDeg = rotAmount * i - snap * i + map(scrollToRotation, 0, 180, 0, 360) - 90;
      // Same fixed-target reasoning as branch 1's lockWeight1 above.
      const deg = rawDeg + nearestRightAngleOffset(rotAmount * i) * lockWeight2;
      boxes[i].rotation.x = THREE.MathUtils.degToRad(deg);
    }

    boxesReady = false;
    titleText = "";

    scrollToVolume = map(scrollPos, 150, 250, 1, 0.1);
  }

  if ((scrollPos > 250) & (scrollPos < 300)) {
    y = 180;
    document.body.style.background = `rgb(0,0,0)`;

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
  console.log(audioPlayed);

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

// Hover and Press Raycaster Setup. MOUSE LOGIC
const raycaster = new THREE.Raycaster();
document.addEventListener("mousemove", OnMouseMove);
document.addEventListener("mousedown", OnMouseDown);
function OnMouseMove(event) {
  const coords = new THREE.Vector2(
    (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    -((event.clientY / renderer.domElement.clientHeight) * 2 - 1),
  );

  raycaster.setFromCamera(coords, camera);

  const intersections = raycaster.intersectObjects(scene.children, true);

  // Small relative hover tilt per box (x,y,z in degrees), applied ON TOP OF
  // whatever rotation the box currently has - never as an absolute target.
  const HOVER_TILT_DEG = {
    0: { x: 12, y: 10, z: -8 },
    1: { x: 0, y: 45, z: 18 },
    2: { x: 25, y: 10, z: -9 },
    3: { x: -18, y: 10, z: 11 },
    4: { x: 14, y: -24, z: -3 },
  };

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
          gsap.fromTo(".heading", { opacity: 0 }, { duration: 0.5, ease: "power4.out", opacity: 1 });
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
      } else {
        console.log("No such object found :/");
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
          // Reset before navigating away so that IF this page gets bfcache'd
          // (browser/UI back button restoring it exactly as left), the
          // restored snapshot doesn't show this box frozen mid-tilt.
          resetAllBoxRotations();
          window.open("HTML/portfolio.html", "_self");
          break;
        case 2:
          clickAudio.play();
          //Open link
          break;
        case 3:
          clickAudio.play();
          resetAllBoxRotations();
          window.open("HTML/about.html", "_self");
          break;
        case 4:
          clickAudio.play();
          resetAllBoxRotations();
          window.open("HTML/contacts.html", "_self");
          break;
        default:
          console.log("No such object found :/");
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
