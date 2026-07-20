//Loading the page
const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

if(!projectId){
    document.body.innerHTML = "<p>Project not found.</p>"
}

fetch("projects.json")
  .then(res => res.json())
  .then(data => {
    const project = data[projectId];

    if (!project) {
      document.body.innerHTML = "<p>Project not found.</p>";
      console.log("Project not found.");
      return;
    }
    
    document.getElementById("hero").src = project.hero;

    document.getElementById("title").textContent = project.title;
    document.getElementById("page-title").textContent = project.title;

    document.querySelector("#year .value").textContent = project.year;
    document.querySelector("#role .value").textContent = project.role;
    document.querySelector("#tools .value").textContent = project.tools;

    

    const imgs = document.querySelectorAll(".grid-item");
    imgs.forEach((img, i) => {
        if(project.images[i]){
            img.src = project.images[i];
        }
        else{
            console.log("parameter count mismatch")
            imgs[imgs.length - i].style.display = "none";
        }
    })

    const captions = document.querySelectorAll(".caption");
    captions.forEach((cap, i) => {
        if(project.captions[i]){
            cap.textContent = project.captions[i];
        }
        else{
            console.log("parameter count mismatch");
            captions[captions.length - i].style.display = "none";
        }
    })
    
    document.getElementById("description").textContent = project.description;

    const links = document.querySelectorAll(".link-item");
    links.forEach((link, i) => {
        if(project.links[i]){
            link.href = project.links[i];
        }
        else(console.log("parameter count mismatch"))
    })
});


const titleHeader = document.querySelectorAll('.title');
const gridItems = document.querySelectorAll('.grid-item');


gridItems.forEach(item => {
    item.addEventListener("click", function() { openFullscreen(item); })
})

function openFullscreen(img) {
    const overlay = document.getElementById('fullscreenOverlay');
    const fullscreenImg = document.getElementById('fullscreenImage');
    fullscreenImg.src = img.src;
    fullscreenImg.alt = img.alt;
    overlay.classList.add('active');
}

function closeFullscreen() {
    const overlay = document.getElementById('fullscreenOverlay');
    overlay.classList.remove('active');
}

// Close on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
    closeFullscreen();
    }
});

gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis
const lenis = new Lenis({
        autoRaf: true,
    });
    
// Connect Lenis to ScrollTrigger for smooth integration
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);


window.addEventListener('DOMContentLoaded', (e) => {
    //Grid items animations
    gsap.utils.toArray(gridItems).forEach((item) => {
    gsap.from(item, {
        y:50,
        opacity:0, 
        // stagger:0.5, 
        duration:0.3, 
        scrollTrigger: {
                    trigger: item,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse',
        ease: 'expo.out',
        // markers: true,
                }
    })
    })

    //Title and the back button animations
    titleHeader.forEach((item) => {
    gsap.fromTo(item, {y:100, opacity:0}, {
        y:0,
        opacity:1, 
        duration:1, 
        ease: 'expo.out',
    })
    })
})