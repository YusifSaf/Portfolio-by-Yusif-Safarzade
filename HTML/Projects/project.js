//Loading the page
const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

if (!projectId) {
  document.body.innerHTML = "<p>Project not found.</p>";
}

fetch("projects.json")
  .then((res) => res.json())
  .then((data) => {
    const project = data[projectId];

    if (!project) {
      document.body.innerHTML = "<p>Project not found.</p>";
      return;
    }

    // Hero can be a still image or a muted looping video - which one just
    // depends on the file extension in projects.json, no extra schema field.
    const heroPlaceholder = document.getElementById("hero");
    const isVideoHero = /\.(mp4|webm)$/i.test(project.hero);
    const hero = document.createElement(isVideoHero ? "video" : "img");
    hero.id = "hero";
    hero.className = heroPlaceholder.className;
    hero.src = project.hero;
    if (isVideoHero) {
      Object.assign(hero, { autoplay: true, muted: true, loop: true, playsInline: true });
    } else {
      hero.alt = project.title;
    }
    heroPlaceholder.replaceWith(hero);

    // Set title
    document.getElementById("title").textContent = project.title;
    const pageTitle = `${project.title} — Yusif Safarzade`;
    document.getElementById("page-title").textContent = pageTitle;
    document.getElementById("og-title").content = pageTitle;
    document.getElementById("page-description").content = project.description;
    document.getElementById("og-description").content = project.description;

    // Set metadata
    document.querySelector("#year .value").textContent = project.year;
    document.querySelector("#role .value").textContent = project.role;
    document.querySelector("#tools .value").textContent = project.tools;
    document.getElementById("description").textContent = project.description;

    // Dynamically create media items
    const imageGrid = document.getElementById("image-grid");
    imageGrid.innerHTML = ""; // Clear placeholder content

    project.media.forEach((mediaItem) => {
      if (mediaItem.type === "image" && /\.(mp4|webm)$/i.test(mediaItem.src)) {
        // A gallery "image" entry that's actually a converted-from-gif local
        // video - same muted looping treatment as the hero, no fullscreen
        // click (a looping preview clip has no meaningful "fullscreen" state).
        const video = document.createElement("video");
        video.classList.add("grid-item");
        Object.assign(video, {
          src: mediaItem.src,
          autoplay: true,
          muted: true,
          loop: true,
          playsInline: true,
        });
        imageGrid.appendChild(video);

        const caption = document.createElement("figcaption");
        caption.classList.add("caption");
        caption.textContent = mediaItem.caption || "";
        imageGrid.appendChild(caption);
      } else if (mediaItem.type === "image") {
        // Create image element
        const img = document.createElement("img");
        img.classList.add("grid-item");
        img.src = mediaItem.src;
        img.alt = mediaItem.caption || "Project Image";
        img.addEventListener("click", function () {
          openFullscreen(img);
        });
        imageGrid.appendChild(img);

        // Create caption
        const caption = document.createElement("figcaption");
        caption.classList.add("caption");
        caption.textContent = mediaItem.caption || "";
        imageGrid.appendChild(caption);
      } else if (mediaItem.type === "video") {
        // Create iframe element
        const iframe = document.createElement("iframe");
        iframe.classList.add("grid-item", "video-embed");
        iframe.src = mediaItem.src;
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        );
        iframe.setAttribute("allowfullscreen", "true");
        imageGrid.appendChild(iframe);

        // Create caption
        const caption = document.createElement("figcaption");
        caption.classList.add("caption");
        caption.textContent = mediaItem.caption || "";
        imageGrid.appendChild(caption);
      }
    });

    // Set links - "www.nothereyet.com" is the placeholder for a link John
    // hasn't filled in yet, so it hides that link item rather than rendering
    // a dead link (accepts the "ww." typo present in a couple of meta.json
    // files too). If that leaves only "Next Project", center it.
    const PLACEHOLDER_LINK = /^w{2,3}\.nothereyet\.com$/i;
    const linksSection = document.querySelector(".links-section");
    const links = document.querySelectorAll(".link-item");
    let visibleCount = 0;
    links.forEach((link, i) => {
      const href = project.links[i];
      if (href && !PLACEHOLDER_LINK.test(href)) {
        link.href = href;
        visibleCount++;
      } else {
        link.closest("h3").classList.add("is-hidden");
      }
    });
    linksSection.classList.toggle("links-section--single", visibleCount === 1);

    // Initialize animations after content is loaded
    initializeAnimations();
  });

// Fullscreen functionality (for images only)
function openFullscreen(img) {
  const overlay = document.getElementById("fullscreenOverlay");
  const fullscreenImg = document.getElementById("fullscreenImage");
  fullscreenImg.src = img.src;
  fullscreenImg.alt = img.alt;
  overlay.classList.add("active");
}

function closeFullscreen() {
  const overlay = document.getElementById("fullscreenOverlay");
  overlay.classList.remove("active");
}

// Close on ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeFullscreen();
  }
});

// Initialize GSAP animations
function initializeAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  // Initialize Lenis
  const lenis = new Lenis({
    autoRaf: true,
  });

  // Connect Lenis to ScrollTrigger for smooth integration
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);

  // Grid items animations
  const gridItems = document.querySelectorAll(".grid-item");
  gsap.utils.toArray(gridItems).forEach((item) => {
    gsap.from(item, {
      y: 50,
      opacity: 0,
      duration: 0.3,
      scrollTrigger: {
        trigger: item,
        start: "top 90%",
        toggleActions: "play none none reverse",
      },
      ease: "expo.out",
    });
  });

  // Title and back button animations
  const titleHeader = document.querySelectorAll(".title");
  titleHeader.forEach((item) => {
    gsap.fromTo(item, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "expo.out" });
  });
}
