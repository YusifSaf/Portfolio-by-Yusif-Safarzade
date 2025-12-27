// three-scene.js
// Mirrors behavior of uploaded p5 script.js
// * means not sure, or possible cause of problems

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

// Variables
let snap = 0;
const rotAmount = 25;
const distance = 200;
let currentScroll = 0;
let y = 0;

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
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(-1000, 0, 0);
  camera.lookAt(0, 0, 0);
  
// Setup Boxes
const boxes = [];
const boxGeometry = new THREE.BoxGeometry(150, 150, 150);
const material = new THREE.MeshNormalMaterial(); // closest to p5 normalMaterial()

for (let i = 0; i < 5; i++) {
  const mesh = new THREE.Mesh(boxGeometry, material);
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
  }

  if(scrollPos > 100 & scrollPos <= 150){
    y = 90;
    document.body.style.background = `rgba(255, 255, 255)`;
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
  }

  if (scrollPos > 250 & scrollPos <= 300){
    y = 180;
    document.body.style.background = `rgb(0,0,0)`;
  }

  
  renderer.render(scene, camera);
  requestAnimationFrame(render);


  // console.log(`Y pos: ${y}`);
  // console.log(`scrollPos%300: ${scrollPos}`);

  // Loop it after 180?
  // how to deal with camera?

  //No -50 or *1.5 yet to make it simple. Find a way to do that based on odd/even
  // u need to i++ on each loop within the scope, not in the conditions
  // for (let i = 0; i<10; i++){
  //   //If even
  //   if(i%2 == 0){
  //     if (scrollPos > i*100 & scrollPos < (i+1)*100){
  //       scrollToRotation = map(scrollPos, i*100, (i+1)*100, i*90, (i+1)*90);

  //       camera.lookAt(0, 0, 0);
  //       const camX = map(scrollToRotation, i*90, (i+1)*90, -1000, 0);
  //       const camZ = map(scrollToRotation, i*90, (i+1)*90, 0, 1000);
  //       camera.position.set(camX, 0, camZ);
  //     }

  //     // if (scrollPos > (i+1)*100 & scrollPos < (i+1)*100*1.5){
  //     //   scrollToRotation = (i+1)*90;

  //     //   snap = map(scrollToRotation, 0, (i+1)*90, 0, rotAmount); // keeps same variable behaviour
  //     //   camera.position.set(0, 0, 1000);
  //     //   camera.lookAt(0, 0, 0);
  //     //   document.body.style.background = `rgb(255,255,255)`;
  //     // }
  //   } 
  //   //If odd
  //   else{
  //     if (scrollPos > i*100 & scrollPos < (i+1)*100){
  //       scrollToRotation = map(scrollPos, i*100, (i+1)*100, i*90, (i+1)*90);

  //       camera.lookAt(0, 0, 0);
  //       const camX = map(scrollToRotation, i*90, (i+1)*90, 0, 1000);
  //       const camZ = map(scrollToRotation, i*90, (i+1)*90, 1000, 0);
  //       camera.position.set(camX, 0, camZ);
  //     }

  //     // if (scrollPos > (i+1)*100 & scrollPos < (i+1)*100*1.5){
  //     //   scrollToRotation = (i+1)*90;

  //     //   snap = map(scrollToRotation, 0, (i+1)*90, 0, rotAmount); // keeps same variable behaviour
  //     //   camera.position.set(1000, 0, 0);
  //     //   camera.lookAt(0, 0, 0);
  //     //   document.body.style.background = `rgb(255,255,255)`;
  //     // }
  //   }
  //   // The Inbetween phase

  //   // if (scrollPos > i*100 & scrollPos < (i+1)*100){
  //   // scrollToRotation = i*90;

  //   // camera.lookAt(0, 0, 0);
  //   // camera.position.set(0, 0, 1000);
  //   // document.body.style.background = `rgb(255,255,255)`;
  //   // }
  // }

//   }

//MY KOLXOZ VERSION
  // if (scrollPos > 0 & scrollPos < 100){
  //   scrollToRotation = map(scrollPos, 0, 100, 0, 90);
    
  //   snap = map(scrollToRotation, 0, 90, 0, rotAmount);
  //   const camX = map(scrollToRotation, 0, 90, -1000, 0);
  //   const camZ = map(scrollToRotation, 0, 90, 0, 1000);
  //   camera.position.set(camX, 0, camZ);
  //   camera.lookAt(0, 0, 0);
  // }

  // if (scrollPos > 100 & scrollPos < 150){
  //   scrollToRotation = 90;

  //   snap = map(scrollToRotation, 0, 90, 0, rotAmount); // keeps same variable behaviour
  //   camera.position.set(0, 0, 1000);
  //   camera.lookAt(0, 0, 0);
  //   document.body.style.background = `rgb(255,255,255)`;
  // }
  
  // if (scrollPos > 150  & scrollPos < 250){
  //   scrollToRotation = map(scrollPos, 150, 250, 90, 180);
    
  //   snap = map(scrollToRotation, 90, 180, 0, rotAmount);
  //   const camX = map(scrollToRotation, 90, 180, 0, 1000);
  //   const camZ = map(scrollToRotation, 90, 180, 1000, 0);
  //   camera.position.set(camX, 0, camZ);
  //   camera.lookAt(0, 0, 0);
  // }

  // if (scrollPos > 250 & scrollPos < 300){
  //   scrollToRotation = 180;

  //   snap = map(scrollToRotation, 0, 180, 0, rotAmount); // keeps same variable behaviour
  //   camera.position.set(1000, 0, 0);
  //   camera.lookAt(0, 0, 0);
  //   document.body.style.background = `rgb(255,255,255)`;
  // }
  
  // if (scrollPos > 300  & scrollPos < 400){
  //   scrollToRotation = map(scrollPos, 300, 400, 180, 270);
    
  //   snap = map(scrollToRotation, 180, 270, 0, rotAmount);
  //   const camX = map(scrollToRotation, 180, 270, -1000, 0);
  //   const camZ = map(scrollToRotation, 180, 270, 0, 1000);
  //   camera.position.set(camX, 0, camZ);
  //   camera.lookAt(0, 0, 0);
  // }

  // if (scrollPos > 400 & scrollPos < 450){
  //   scrollToRotation = 270;

  //   snap = map(scrollToRotation, 0, 270, 0, rotAmount); // keeps same variable behaviour
  //   camera.position.set(0, 0, 1000);
  //   camera.lookAt(0, 0, 0);
  //   document.body.style.background = `rgb(255,255,255)`;
  // }

  // if (scrollPos > 450  & scrollPos < 550){
  //   scrollToRotation = map(scrollPos, 450, 550, 270, 360);
    
  //   snap = map(scrollToRotation, 270, 360, 0, rotAmount);
  //   const camX = map(scrollToRotation, 270, 360, 0, 1000);
  //   const camZ = map(scrollToRotation, 270, 360, 1000, 0);
  //   camera.position.set(camX, 0, camZ);
  //   camera.lookAt(0, 0, 0);
  // }
  
  // if (scrollPos > 550 & scrollPos < 600){
  //   scrollToRotation = 360;

  //   snap = map(scrollToRotation, 0, 360, 0, rotAmount); // keeps same variable behaviour
  //   camera.position.set(1000, 0, 0);
  //   camera.lookAt(0, 0, 0);
  //   document.body.style.background = `rgb(255,255,255)`;
  // }

  // %4 VERSION
  // for (let i = 4; i<10; i++){
  //   //If even
  //   if(i%4 == 0){
  //     if (scrollPos > i*100 & scrollPos < (i+1)*100){
  //       scrollToRotation = map(scrollPos, i*100, (i+1)*100, i*90, (i+1)*90);

  //       camera.lookAt(0, 0, 0);
  //       const camX = map(scrollToRotation, i*90, (i+1)*90, -1000, 0);
  //       const camZ = map(scrollToRotation, i*90, (i+1)*90, 0, 1000);
  //       camera.position.set(camX, 0, camZ);
  //     }

  //     if (scrollPos > (i+1)*100 & scrollPos < (i+1)*100*1.5){
  //       scrollToRotation = (i+1)*90;

  //       snap = map(scrollToRotation, 0, (i+1)*90, 0, rotAmount); // keeps same variable behaviour
  //       camera.position.set(0, 0, 1000);
  //       camera.lookAt(0, 0, 0);
  //       document.body.style.background = `rgb(255,255,255)`;
  //     }
  //   } 

  //   if(i%4 == 1){
  //     if (scrollPos > i*100*1.5 & scrollPos < (i+1)*100*1.5){
  //       scrollToRotation = map(scrollPos, i*100, (i+1)*100, i*90, (i+1)*90);

  //       camera.lookAt(0, 0, 0);
  //       const camX = map(scrollToRotation, i*90, (i+1)*90, -1000, 0);
  //       const camZ = map(scrollToRotation, i*90, (i+1)*90, 0, 1000);
  //       camera.position.set(camX, 0, camZ);
  //     }

  //     if (scrollPos > (i+1)*100 & scrollPos < (i+1)*100*1.5){
  //       scrollToRotation = (i+1)*90;

  //       snap = map(scrollToRotation, 0, (i+1)*90, 0, rotAmount); // keeps same variable behaviour
  //       camera.position.set(0, 0, 1000);
  //       camera.lookAt(0, 0, 0);
  //       document.body.style.background = `rgb(255,255,255)`;
  //     }
  //   } 

  //   if(i%4 == 2){
  //     if (scrollPos > i*100 & scrollPos < (i+1)*100){
  //       scrollToRotation = map(scrollPos, i*100, (i+1)*100, i*90, (i+1)*90);

  //       camera.lookAt(0, 0, 0);
  //       const camX = map(scrollToRotation, i*90, (i+1)*90, -1000, 0);
  //       const camZ = map(scrollToRotation, i*90, (i+1)*90, 0, 1000);
  //       camera.position.set(camX, 0, camZ);
  //     }

  //     if (scrollPos > (i+1)*100 & scrollPos < (i+1)*100*1.5){
  //       scrollToRotation = (i+1)*90;

  //       snap = map(scrollToRotation, 0, (i+1)*90, 0, rotAmount); // keeps same variable behaviour
  //       camera.position.set(0, 0, 1000);
  //       camera.lookAt(0, 0, 0);
  //       document.body.style.background = `rgb(255,255,255)`;
  //     }
  //   } 

  //   if(i%4 == 3){
  //     if (scrollPos > i*100 & scrollPos < (i+1)*100){
  //       scrollToRotation = map(scrollPos, i*100, (i+1)*100, i*90, (i+1)*90);

  //       camera.lookAt(0, 0, 0);
  //       const camX = map(scrollToRotation, i*90, (i+1)*90, -1000, 0);
  //       const camZ = map(scrollToRotation, i*90, (i+1)*90, 0, 1000);
  //       camera.position.set(camX, 0, camZ);
  //     }

  //     if (scrollPos > (i+1)*100 & scrollPos < (i+1)*100*1.5){
  //       scrollToRotation = (i+1)*90;

  //       snap = map(scrollToRotation, 0, (i+1)*90, 0, rotAmount); // keeps same variable behaviour
  //       camera.position.set(0, 0, 1000);
  //       camera.lookAt(0, 0, 0);
  //       document.body.style.background = `rgb(255,255,255)`;
  //     }
  //   } 
  
// CLAUDE VERSION
  // if (scrollPos > 100 & scrollPos < 150){
  //   scrollToRotation = map(scrollPos, 150, 250, 90, 180);
    
  //   snap = map(scrollToRotation, 90, 180, 0, rotAmount);
  //   const camX = map(scrollToRotation, 90, 180, 0, 1000);
  //   const camZ = map(scrollToRotation, 90, 180, 1000, 0);
  //   camera.position.set(camX, 0, camZ);
  //   camera.lookAt(0, 0, 0);
  // }
  
  // console.log(scrollPos);
  
  // if (scrollPos < 1000) {
  //   angleY = map(scrollPos, 0, 1000, 0, 90);
  //   snap = map(angleY, 0, 90, 0, rotAmount);
  //   const camX = map(angleY, 0, 90, -1000, 0);
  //   const camZ = map(angleY, 0, 90, 0, 1000);
  //   camera.position.set(camX, 0, camZ);
  //   camera.lookAt(0, 0, 0);

  //   const bg = Math.round(map(angleY, 0, 70, 0, 255));
  //   document.body.style.background = `rgb(${bg},${bg},${bg})`;
  // }
  // if (scrollPos > 1000 && scrollPos < 1500) {
  //   angleY = 90;
  //   snap = map(angleY, 0, 90, 0, rotAmount); // keeps same variable behaviour
  //   camera.position.set(0, 0, 1000);
  //   camera.lookAt(0, 0, 0);
  //   document.body.style.background = `rgb(255,255,255)`;
  // }
  // if (scrollPos > 1500 && scrollPos < 2500) {
  //   angleY = map(scrollPos, 1500, 2500, 90, 180);
  //   snap = map(angleY, 90, 180, rotAmount, 0);
  //   const camX = map(angleY, 90, 180, 0, 1000);
  //   const camZ = map(angleY, 90, 180, 1000, 0);
  //   camera.position.set(camX, 0, camZ);
  //   camera.lookAt(0, 0, 0);

  //   const bg = Math.round(map(angleY, 90, 160, 255, 0));
  //   document.body.style.background = `rgb(${bg},${bg},${bg})`;
  // }
  // if (scrollPos > 2500) {
  //   document.body.style.background = `rgb(0,0,0)`;
  // }
}

render();

// Raycaster Setup
const raycaster = new THREE.Raycaster();

document.addEventListener('mousedown', OnMouseDown);

function OnMouseDown(event){
  const coords = new THREE.Vector2(
    (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    -((event.clientY / renderer.domElement.clientHeight) * 2 -1),
  );

  raycaster.setFromCamera(coords, camera);

  const intersections = raycaster.intersectObjects(scene.children, true);
  if (intersections.length > 0){
    console.log(intersections[0].object);
  }
}



// Initialize Lenis and adjust gsap
const lenis = new Lenis({
  autoRaf: true,
  lerp: 0.05, // adjust the smoothness of the scroll
  wheelMultiplier: 0.1 // adjust the speed/sensitivity of the scroll
});
gsap.ticker.lagSmoothing(0);

lenis.on("scroll", (e) => {
  currentScroll = e.scroll;
})

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

