Pages:
- Home
- Portfolio
- Project(s)
- Resume
- About
- Contact
---
# Home

The home page is the first page that the user sees. It includes 5 cubes, each in front of each other (obstructing each other). They spin along with the camera, as the user scrolls, until camera faces them perpendicularly, where every cube is visible. User then can click on each of the cubes which lead the user to another page (That was set up using raycasting). When the user hovers over the cubes they "spin" on a very small angle < 60deg

The whole scroll logic has 2 phases which loop infinitely. Dark phase and Light phase. Once the camera does a 90 degree spin along the Y axis, visual switch from dark phase to light one. The background and the text color also change with the phases. 

As the home page starts there is an ambient background music which starts playing. It is playing very quietly during dark phase and increases in volume as the user scrolls, until reaching its peak at the light phase.
## Must-have:
**Claude's note on sequencing:** the color-scheme system below (dynamic gradient + per-face cube colors + random theme generator) is a substantial subsystem built on top of the same scroll/phase state machine that has the rotation bugs listed under "To fix." Recommend fixing the bugs first, then building the color system on a stable base — otherwise two systems end up tangled together while debugging.

### To implement:
- Dynamic dark gradient background which changes to very a light color, as the user scrolls. 
	- The dynamic part of it means -  a gradient that is constantly and slowly "flowing". A good example would be a JS snippet taken from this website 
	  [Blue Ambient Light Background | Color Abstract Background](https://www.color4bg.com/generator/blue-ambient-light-background)
	  The snippet:
	```JavaScript
        <script src="Ambient LightBg.min.js"></script>

        let colorbg = new Color4Bg.Ambient LightBg({
            dom: "box",
            colors: ["#4A86B4","#265999","#1781C2","#0CBCEB","#D6FFFA","#4A86B4"],
            loop: true
        })
	```
	- Make sure to have the parameters like:
		- Speed of the flowing
		- Scale of the gradient
		- Manual Color setting
		- Seed for random generation
	- Keep in mind that the gradient colors are gonna be set up according to the random color schemes, which are described below
	
	How to verify:
	- The background consists of a dark 2-color minimum gradient which changes to a very light gradient as the user scrolls
	- The bg gradient is constantly and slowly "flowing", the color are "moving"
	- There are controllable parameters like
		- Speed of the flowing
		- Scale of the gradient
		- Manual Color setting
		- Seed for random generation
	- The whole feature is resource-efficient, renders without using too many resources, preventing the page from lagging

- Color for each side of the cubes
	- Right now each side of each cube has a its own unique color which change. That was done by using `normalMaterial()` function, which just creates an illusion of each side having its own color. Instead I want you to set up the script in a way where each side actually has its own color (for both dark and light states).
	- Keep in mind that those color would also be randomly generated, and they would have to fit into the whole color scheme (which is described below). The cube colors could be complimentary to the bg (in both phases)
	
	How to verify:
	 - Each side of each cube has a its own color which change. The same side of each cube could be different shades of one color or close in color, to keep the page from having too many colors
	 - The colors change as the user scrolls
     - The whole feature is resource-efficient, renders without using too many resources, preventing the page from lagging


- Random color scheme on each website reload. That includes the bg gradient color as well as colors for the boxes (and what both change to as the user scrolls)
	- Be sure to include both ambient/minimalistic schemes (dark blues for example) as well as bolder ones (crimson red with yellow for example)
	- "Color change as scroll" logic is already in the code. You would just need to tweak it
	- Keep the text white and dark color scheme color as when the switch from dark to light. 
	
	How to verify
	- Color scheme is applied to both background and the cubes
	- I can be easily manually set the colors for both background and the cubes
	- It uses has a random seed parameter, so on each page load it gives a new color scheme
	- The color scheme features both ambient/minimalistic and bold color schemes
	- The color scheme accounts for both dark and light phases
	- The color schemes uses complimentary colors for background and cubes
	- The text is kept pure white during dark phase, and dark color scheme color during light phase
	- The whole color scheme works together, creating a visually appealing effect

### To fix (bugs):
- The top text just abruptly appears instead of slowly fading in, once the phase switch is reached. Make it fade in
- The music doesn't start playing on page load. It only starts playing once the user presses anywhere on the page. Make it play right away, on load
	- **Claude's note:** browsers block autoplay-with-sound until the user has interacted with the page/site at all (a platform policy, not a code bug). I can make it start on the very first click/scroll/keypress anywhere, instead of requiring a deliberate press, but "plays immediately with zero interaction" isn't achievable cross-browser as shipped.
- When aiming on a cube for the first time, instead of making a rotating to a small amount, it does a crazy > 360deg angle spin. Once hovered on the second time, it behaves as intended. Make it always spin to the small angle which I wrote and intended in the code
- When the camera does a full 180 rotation (dark-light-dark switch), the cubes are supposed to be rotated to look like their original state (0/90/180/270/360 deg). However; sometimes it looks like it is stuck at 88 deg. Make it always snap back to strict angles (the ones written above).
- Sometimes before rotating to the original state (the strict angles above) in the dark phase (dark-light-dark), they will do a crazy >= 540 rotation. Find the source of the bug and make it always return back to the original strict angle without the additional crazy spin
	- **Claude's note:** the three bugs above (crazy first-hover spin, stuck-at-88°, ≥540° spin) look like one root cause, not three — `rotation.x` accumulates raw, non-wrapped degree values during scroll, and GSAP tweens linearly from whatever that raw value currently is. Likely a single angle-normalization fix before every tween, not three separate patches.
- On page reload, or when going to a new page and then going back, it shows the initial position (0 deg) but once scrolled it abruptly jumps to the last position before the user went to the new page. Make it more consistent - make it always return to the initial position
	- **Claude's note:** likely the same root cause as the Global "back button" bug — the browser's back/forward cache (bfcache) is probably restoring this page without re-running the scroll-reset logic. See Global section.
- Clicking the "Home" cube (index 0) and "Resume" cube (index 2) currently does nothing — `OnMouseDown`'s switch statement has `//Open link` as a placeholder comment for both, with no real navigation wired up.
	- Resume cube: hold off until the Resume page has content.
	- Home cube: open question — what should happen when you click "Home" while already on the home page? (no-op, scroll-to-top, something else?)

### To optimize:
- Make sure that resource-wise everything is being rendered and executed efficiently. If there is room for optimization and improvement in the way everything runs on this page -- let me know, so I can make a decision and give you further instructions.
---
# Portfolio

The home page is a 4x4 grid, with the title header at the top and another header at the very bottom of the page. All the elements of the grid are gif images which constantly play on the website. Once user hovers over one of the elements, it turns half opaque and shows the title of the element (project)
## Must-have:
### To implement:
- Same idea with dynamic gradient background as for the "Home" page. Take all the instructions from there.
- A very clean and simple way to keep on adding new projects on to the page. 
	- Right now I'm using a simple JSON file system
	- Make a system which is more convenient, fast and with more flexibility. Let me know if that would require more instructions from me.
	- **Confirmed structural change:** move away from one central `projects.json` file:
		- Each project's `meta.json` lives inside its own folder under `HTML/Projects/images/<id>/`, right next to its images — adding a project means dropping a folder in, not editing a shared file.
		- A small generator script scans all `HTML/Projects/images/*/meta.json` and builds the single `projects.json` the site fetches at runtime.
		- **Why not true runtime folder discovery:** this site is static-hosted (GitHub Pages, per `package.json`'s repo URL) with no server or directory-listing endpoint, so the browser can't ask "what folders exist" at runtime — discovery has to happen at build/generate time, producing the same runtime file as today. Only the *authoring* workflow changes.
		- This also means the `add-project` skill needs a follow-up update later, to write `meta.json` instead of editing the central JSON directly.
- If in a 4x4 grid there is an empty space, take one of the elements and stretch them (into width) to be 1x2, so that the whole grid space is taken.
### To fix:
- Make the title header ALLCAPS, slightly larger and with letters wide apart.
- Because all the gifs are running simultaneously for each grid element and there are so many of them - after having the page open for > 30sec it start really lagging. My method was inefficient.
	- Find something to show dynamic previews of each project in a more resource-efficient way
	- Let me know if I would need to provide a different type of files for the previews (instead of .gif)
	- **Confirmed fix: switch previews to muted, looping `<video>` (mp4/webm)** instead of `.gif` — hardware-accelerated, typically 5-10x smaller files. Not a drop-in swap; it touches several places together:
		- `portfolio.html`'s grid markup (currently hardcoded `<img src=".../hero.gif">` per item) needs to become `<video autoplay muted loop playsinline>` (or JS-driven so it can pick the right tag per file type)
		- `project.html`'s hero element (currently a plain `<img id="hero">`) needs the same treatment
		- `project.js`'s media-rendering logic needs a new media `type` (a looping preview video is different from the existing `"video"` type, which renders an iframe embed)
		- `projects.json`/`meta.json` schema needs a way to say "this media item is a looping preview" vs. a regular image/iframe
		- CSS selectors targeting `.grid-item img` need a `video` variant too
- **Found while reading the code — not yet decided:** `HTML/Projects/1portfolioWebsite.html` and `2fieldHandbook.html` are orphaned (not linked from `portfolio.html`, the JSON, or anywhere else — leftover from before the unified `project.html` system). Confirm before removing them.

## Nice to have:
- Zoom transition for the hyperlink opening when a user presses on one of the grid elements (projects)
---
# Project page

## Must have:
### To implement:
- If in the project upload system (currently JSON file) there is nothing set for "View live demo" or "View on Github", don't include those on the bottom of the page, and center the "Next Project" to the middle
	- **Note:** "Next Project" is currently a dead `href="#"` with no data behind it — needs an explicit ordering added to the data model (e.g. a `next` id per project, or derive order from folder/JSON order) before this link can work at all.
### To fix:
- Make the title header ALLCAPS, slightly larger and with letters wide apart.

### To optimize:
- Analyze if the gif lagging issues found on the "portfolio page" could be found here to, due to a gif constantly playing for the preview.
	- If yes, suggest me an alternative to make it more resource-friendly
	- **Confirmed: yes, same issue.** Same fix as the Portfolio page — see the video-conversion note there, since the hero + media grid on this page use the same `.gif` files.

## Nice to have:
- Dynamic color scheme for bg based on the color of the title preview (gif) uploaded.
	- Make it a very ambient gradient, so that the main focus is on preview and the text
---
# Resume

Not planned yet — `HTML/resume.html` is currently an empty file. John will add content later.

---
# About

Not planned in detail yet — John will add more soon. For now:

## Must-have:
### To implement:
- Same dynamic gradient background as the Home page (see Home section for full spec).

(Hero image already swapped from the old 12.9MB `highResBG.png` to the Hong Kong skyline photo — done.)
---
# Contacts

## Must-have:
### To implement:
- Same idea with dynamic gradient background as for the "Home" page. Take all the instructions from there.
### To fix:
- Make the title header ALLCAPS, slightly larger and with letters wide apart.

**Note:** the placeholder contact info (email, phone, LinkedIn, GitHub, location) will be filled in by John himself later, before deployment — not a Claude task.

I may add something here later on

---
# Global 
This is something that is persistent across al pages
### To fix:
- Back button doesn't actually lead back
	- **Claude's note:** likely the same root cause as the Home page's reload/back scroll-jump bug (see Home > To fix) — the browser's back/forward cache (bfcache) probably restores the page without re-running the load-time scroll reset. Likely fix is handling the `pageshow` event (checking `event.persisted`), not two separate patches.
- Old, unused hero image `images/highResBG.png` (12.9MB) is now orphaned — About page's hero was swapped to the Hong Kong skyline photo (done). Confirm before deleting the old file.

### Found while reading the code (not yet in scope, flagging for a decision):
- Every page duplicates the same ~15-20 lines of Lenis/GSAP/ScrollTrigger `<script>` tags and init boilerplate. Worth factoring into one shared JS file during the polish pass so a future fix doesn't need repeating in 5 places.
- Lenis version is inconsistent: `1.3.15` on the home page vs. `1.3.17` everywhere else.
- The back-arrow icon is fetched live from `api.iconify.design` on every page load — cheap to self-host that one SVG instead.
- No favicon, no meta description/Open Graph tags anywhere — open question: in scope for "finished product" or skip?

Let me know if breaking everything down into separate subagents would be better
	- **Claude's answer:** no — nearly everything above is entangled (the gradient background is shared across Home/Portfolio/About/Contacts, the video-conversion fix applies to both Portfolio and Project, the back-button bug and Home's scroll-jump bug are likely one fix). Parallel agents would duplicate investigation or conflict on shared code. This is sequential work with checkpoints.