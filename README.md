# Portfolio — Yusif Safarzade

Personal portfolio website, built as static HTML/CSS/JS with no bundler.
Live at
[yusifsaf.github.io/Portfolio-by-Yusif-Safarzade](https://yusifsaf.github.io/Portfolio-by-Yusif-Safarzade/).

## Tech stack

- Plain HTML/CSS/JS (ES modules), no build step for the site itself
- [three.js](https://threejs.org/) — the interactive 3D cube on the Home page
- [GSAP](https://gsap.com/) + [ScrollTrigger](https://gsap.com/scrolltrigger/) — animations
- [Lenis](https://lenis.darkroom.engineering/) — smooth scrolling
- [Howler](https://howlerjs.com/) — audio on the Home page
- Hosted on GitHub Pages

## Structure

- `index.html` — Home page (3D cube navigation)
- `HTML/portfolio.html` — project grid
- `HTML/about.html`, `HTML/contacts.html`, `HTML/resume.html`
- `HTML/Projects/` — project detail page template + data:
  - `categories.json` groups project ids into the sections shown on the
    portfolio grid
  - each project has its own `images/<id>/meta.json`
  - `build-projects.js` (run via `npm run build-projects`) regenerates
    `projects.json` from the two above — this is the one file
    `portfolio.html`/`project.js` actually read at runtime

## Local development

```
npm install
npm run serve          # local dev server at http://localhost:5500
npm run build-projects  # regenerate projects.json after editing a project
npm run lint
npm run format
```

## Adding a project

See the `add-project` workflow/skill, or manually: add a folder under
`HTML/Projects/images/<id>/` with a `meta.json` and media files, list `<id>`
in `categories.json`, then run `npm run build-projects`.
