// three-scene.js
// Mirrors behavior of uploaded p5 script.js
// * means not sure, or possible cause of problems

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { gsap } from '//cdn.skypack.dev/gsap?min'

// Variables
let snap = 0;
const rotAmount = 25;
const distance = 260;
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

//Audio References
let audioPlayed = false;
// const hoverAudio = document.querySelector('.hover-audio');
// const BGAudio = document.querySelector('.bg-audio');

// Initialize Lenis and adjust gsap
const lenis = new Lenis({
  autoRaf: true,
  lerp: 0.05, // adjust the smoothness of the scroll
  wheelMultiplier: 0.1 // adjust the speed/sensitivity of the scroll
});
gsap.ticker.lagSmoothing(0);

window.addEventListener('load', ()=> {
  lenis.scrollTo(0, { immediate: true });
})

lenis.on("scroll", (e) => {
  currentScroll = e.scroll;
})

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
  mesh.position.x = distance * i - distance*2;
  scene.add(mesh);
  boxes.push(mesh);
}

// Keep scene ambient-ish so normals show nicely
const ambient = new THREE.AmbientLight(0xffffff, 0.0); // minimal; MeshNormalMaterial doesn't need lighting
scene.add(ambient);

// Make sure canvas is full-screen and fixed like original CSS intended *
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '-1';


// Main render loop
function render() {
  // replicate the original modulo scroll behavior
  // const scrollPos = window.scrollY % 2500;

  const scrollPos = currentScroll%300; // we used %300 instead of forLoop
  let scrollToRotation = 0;

  // Jav's Method
  if(scrollPos <= 100){
    y = 90 * scrollPos/100;
    scrollToRotation = map(scrollPos, 0, 100, y-90, y);

    snap = map(scrollToRotation, y-90, y, 0, rotAmount);
    const camX = map(scrollToRotation, y-90, y, -1000, 0);
    const camZ = map(scrollToRotation, y-90, y, 0, 1000);
    camera.position.set(camX, 0, camZ);
    camera.lookAt(0, 0, 0);

    const bg = Math.round(map(scrollToRotation, y-90, y, 0, 255));
    document.body.style.background = `rgb(${bg},${bg},${bg})`;

    for (let i = 0; i < boxes.length; i++) {
      const deg = rotAmount * i - snap * i + map(scrollToRotation, 0, 180, 0, 360);
      boxes[i].rotation.x = THREE.MathUtils.degToRad(deg);
    }

    boxesReady = false;
    hoverWasSet = false; //So each loop it show the "Press to Interact."

    if(scrollPos >= 0 & scrollPos < 30){
      titleText = "Scroll to Interact."
      title.style.color = `rgb(${255},${255},${255})`
    }
    else{
      titleText = ""
    }
  }

  if(scrollPos > 100 & scrollPos <= 150){
    y = 90;
    document.body.style.background = `rgba(255, 255, 255)`;

    boxesReady = true;
    if (!hoverWasSet){
      titleText = "Press to Interact."
    }
    title.style.color = `rgb(${0},${0},${0})`
    // This is where sections appear
  }

  if(scrollPos > 150 & scrollPos <= 250){
    y = 90 + 90 * scrollPos/100;
    scrollToRotation = map(scrollPos, 150, 250, y-90, y);

    snap = map(scrollToRotation, y-90, y, rotAmount, 0);
    const camX = map(scrollToRotation, y-90, y, 0, 1000);
    const camZ = map(scrollToRotation, y-90, y, 1000, 0);
    camera.position.set(camX, 0, camZ);
    camera.lookAt(0, 0, 0);

    const bg = Math.round(map(scrollToRotation, y-90, y, 255, 0));
    document.body.style.background = `rgb(${bg},${bg},${bg})`;

    for (let i = 0; i < boxes.length; i++) {
      const deg = rotAmount * i - snap * i + map(scrollToRotation, 0, 180, 0, 360);
      boxes[boxes.length-1-i].rotation.x = THREE.MathUtils.degToRad(deg);
    }

    boxesReady = false;
    titleText = ""
  }

  if (scrollPos > 250 & scrollPos < 300){
    y = 180;
    document.body.style.background = `rgb(0,0,0)`;

    boxesReady = false;
  }
  // console.log(scrollPos);
  // console.log(boxesReady)

  resetBoxHover();
  title.textContent = titleText //Setting the HTML text
  
  // console.log(Math.round(THREE.MathUtils.radToDeg(boxes[0].rotation.x)));
  console.log(currentlyHovering);
  if(currentlyHovering){
    lenis.stop();
  }
  else{ lenis.start(); }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();

// Functions
//This function is constntly running in update to solve the bug with box's hover size staying the same if u hover on it and scroll past the boxesReady poing
function resetBoxHover(){
  if(!boxesReady){
      for (let i = 0; i<boxes.length; i++){
        boxes[i].position.y = 0;
        boxes[i].scale.set(1,1,1);
      }
    }
}

// Hover and Press Raycaster Setup. MOUSE LOGIC
const raycaster = new THREE.Raycaster();
document.addEventListener('mousemove', OnMouseMove);
document.addEventListener('mousedown', OnMouseDown);
function OnMouseMove(event){
  const coords = new THREE.Vector2(
    (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    -((event.clientY / renderer.domElement.clientHeight) * 2 -1),
  );

  raycaster.setFromCamera(coords, camera);

  const intersections = raycaster.intersectObjects(scene.children, true);
  
  if (intersections.length > 0){
    
    hoverWasSet = true;
    const selectedObjectIndex = intersections[0].object.name;
    //Reset when switching to another box
    if(previousBox !== null && previousBox !== selectedObjectIndex){
      gsap.to(boxes[previousBox].scale, { duration:0.5, ease:"power4.out", x: 1, y: 1, z: 1});
      gsap.to(boxes[previousBox].rotation, { duration:0.5, ease:"power4.out", x: 0, y: 0, z: 0});
    }

    previousBox = selectedObjectIndex;

    //When select is available
    if(boxesReady){
      // console.log(`Hovered on ${intersections[0].object.name}`);
      currentlyHovering = true;
      if(!audioPlayed){
        // hoverAudio.play();
        audioPlayed = true;
      }
      let currentBox;
      switch (selectedObjectIndex){
        case 0:
          titleText = "Home.";
          if(!titleAnimationFired){
            gsap.fromTo('.heading', {opacity:0}, {duration:0.5, ease:"power4.out", opacity: 1})
          }
          titleAnimationFired = true;

          currentBox = boxes[0]
          // currentBox.position.y = yPositionOnHover;
          // gsap.to(currentBox.position, { duration:1, ease:"power4.out", y: yPositionOnHover});
          // currentBox.scale.set(scaleOnHover, scaleOnHover, scaleOnHover);
          gsap.to(currentBox.scale, { duration:0.5, ease: "power4.out", x: scaleOnHover, y: scaleOnHover, z: scaleOnHover});
          gsap.to(currentBox.rotation, { duration:0.5, ease: "power4.out", x: THREE.MathUtils.degToRad(12), y: THREE.MathUtils.degToRad(10), z: THREE.MathUtils.degToRad(-8)});
          break
        case 1:
          titleText = "Portfolio.";
          if(!titleAnimationFired){
            gsap.fromTo('.heading', {opacity:0}, {duration:0.5, ease:"power4.out", opacity: 1})
          }
          titleAnimationFired = true;

          currentBox = boxes[1]
          // currentBox.position.x = yPositionOnHover;
          // currentBox.scale.set(scaleOnHover, scaleOnHover, scaleOnHover);
          gsap.to(currentBox.scale, { duration:0.5, ease: "power4.out", x: scaleOnHover, y: scaleOnHover, z: scaleOnHover});
          gsap.to(currentBox.rotation, { duration:0.5, ease: "power4.out", x: THREE.MathUtils.degToRad(0), y: THREE.MathUtils.degToRad(45), z: THREE.MathUtils.degToRad(18)});
          // currentBox.rotation.set(THREE.MathUtils.degToRad(45), THREE.MathUtils.degToRad(45), THREE.MathUtils.degToRad(45));
          break
        case 2:
          titleText = "Resume.";
          if(!titleAnimationFired){
            gsap.fromTo('.heading', {opacity:0}, {duration:0.5, ease:"power4.out", opacity: 1})
          }
          titleAnimationFired = true;

          currentBox = boxes[2]
          // currentBox.position.y = yPositionOnHover;
          // currentBox.scale.set(scaleOnHover, scaleOnHover, scaleOnHover);
          gsap.to(currentBox.scale, { duration:0.5, ease: "power4.out", x: scaleOnHover, y: scaleOnHover, z: scaleOnHover});
          gsap.to(currentBox.rotation, { duration:0.5, ease: "power4.out", x: THREE.MathUtils.degToRad(25), y: THREE.MathUtils.degToRad(10), z: THREE.MathUtils.degToRad(-9)});
          break
        case 3:
          titleText = "About.";
          if(!titleAnimationFired){
            gsap.fromTo('.heading', {opacity:0}, {duration:0.5, ease:"power4.out", opacity: 1})
          }
          titleAnimationFired = true;

          currentBox = boxes[3]
          // currentBox.position.y = yPositionOnHover;
          // currentBox.scale.set(scaleOnHover, scaleOnHover, scaleOnHover);
          gsap.to(currentBox.scale, { duration:0.5, ease: "power4.out", x: scaleOnHover, y: scaleOnHover, z: scaleOnHover});
          gsap.to(currentBox.rotation, { duration:0.5, ease: "power4.out", x: THREE.MathUtils.degToRad(-18), y: THREE.MathUtils.degToRad(10), z: THREE.MathUtils.degToRad(11)});
          break
        case 4:
          titleText = "Contacts.";
          if(!titleAnimationFired){
            gsap.fromTo('.heading', {opacity:0}, {duration:0.5, ease:"power4.out", opacity: 1})
          }
          titleAnimationFired = true;

          currentBox = boxes[4]
          // currentBox.position.y = yPositionOnHover;
          // currentBox.scale.set(scaleOnHover, scaleOnHover, scaleOnHover);
          gsap.to(currentBox.scale, { duration:0.5, ease: "power4.out", x: scaleOnHover, y: scaleOnHover, z: scaleOnHover});
          gsap.to(currentBox.rotation, { duration:0.5, ease: "power4.out", x: THREE.MathUtils.degToRad(14), y: THREE.MathUtils.degToRad(-24), z: THREE.MathUtils.degToRad(-3)});
          break
        default:
          console.log("No such object found :/");
          break
      }
    }
  }
  if(intersections.length == 0){
    currentlyHovering = false;
    if (audioPlayed){
      // hoverAudio.pause();
      audioPlayed = false;
    }
    //Restore default box position and scale when not hovering over any.
    for (let i = 0; i<boxes.length; i++){
      // boxes[i].position.y = 0;
      // gsap.to(boxes[i].position, { duration:1, ease:"power4.out", y: 0});
      // boxes[i].scale.set(1,1,1);
      gsap.to(boxes[i].scale, { duration:0.5, ease:"power4.out", x: 1, y: 1, z: 1});
      if(Math.round(THREE.MathUtils.radToDeg(boxes[i].rotation.x)) != 178 && Math.round(THREE.MathUtils.radToDeg(boxes[i].rotation.x)) != 179 && Math.round(THREE.MathUtils.radToDeg(boxes[i].rotation.x)) != 180 && Math.round(THREE.MathUtils.radToDeg(boxes[i].rotation.x)) != 270){
        gsap.to(boxes[i].rotation, { duration:0.5, ease:"power4.out", x: 0, y: 0, z: 0});
      }
      // if(Math.round(THREE.MathUtils.radToDeg(boxes[i].rotation.x)) <= 178 && Math.round(THREE.MathUtils.radToDeg(boxes[i].rotation.x)) >= 180){ // This line was added to avoid the glitch with boxes chaotically spinning the very first time u open the site, scroll to boxesReady and move your mouse. We used ceil to round up, cuz with round u'd get 179 instead of 180, and I wanted it to be pretty)
      // } // U stopped here
    }
    titleAnimationFired = false;
    previousBox = null;
  }
  if(intersections.length == 0 && boxesReady){
    titleText = "" //Remove text when no hover and no hint
  }
}

function OnMouseDown(event){
  const coords = new THREE.Vector2(
    (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    -((event.clientY / renderer.domElement.clientHeight) * 2 -1),
  );

  raycaster.setFromCamera(coords, camera);

  const intersections = raycaster.intersectObjects(scene.children, true);
  
  if (intersections.length > 0){
    const selectedObjectIndex = intersections[0].object.name;
    if(boxesReady){
      // console.log(`Clicked on ${intersections[0].object.name}`);
      switch (selectedObjectIndex){
        case 0:
          //Open link
          break
        case 1:
          window.open('HTML/portfolio.html', '_self')
          break
        case 2:
          //Open link
          break
        case 3:
          window.open('HTML/about.html', '_self')
          break
        case 4:
          window.open('HTML/contacts.html', '_self')
          break
        default:
          console.log("No such object found :/");
            break
      }
    }
  }
}

// window.addEventListener('DOMContentLoaded', (e) => {
//   BGAudio.play();
// });

// Helper Functions
function map(v, a, b, c, d) {
  const t = (v - a) / (b - a);
  return c + t * (d - c);
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// Resize handler
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

