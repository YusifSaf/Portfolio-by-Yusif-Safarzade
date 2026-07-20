---
name: add-project
description: Scaffold a new portfolio project entry — adds a projects.json entry, creates the matching image folder under HTML/Projects/images/, and adds a grid-item link on portfolio.html. Use when the user wants to add a new project to the portfolio site.
---

Add a new project to the portfolio. Gather from the user (ask if not given): project id (slug, must be all-lowercase, hyphen-separated — this matters, see the casing note below), title, year, role, tools, description, category (`Web-based`, `Game Development`, or `Design / Art / Installation` — matches a `<section class="category-section">` in `HTML/portfolio.html`), and at least a hero image filename.

Steps:

1. **Create the image folder**: `HTML/Projects/images/<id>/` (lowercase id). Put a placeholder `hero.gif` or `hero.jpg` reference in place if the user hasn't supplied real assets yet — note clearly that they still need to drop the real file in.

2. **Add the entry to `HTML/Projects/projects.json`**: append a new top-level key (the lowercase id) following the existing shape exactly:

   ```json
   "<id>": {
     "hero": "images/<id>/hero.gif",
     "title": "...",
     "year": "...",
     "role": "...",
     "tools": "...",
     "description": "...",
     "media": [
       { "type": "image", "src": "images/<id>/image1.gif", "caption": "..." }
     ],
     "links": [
       "<live demo url or www.nothereyet.com>",
       "<github url or www.nothereyet.com>",
       "/HTML/Projects/project.html?id=<next-project-id>"
     ]
   }
   ```

   The third `links` entry is a "next project" pointer to another project's id — ask the user which project it should chain to, or default to chaining from the current last project in the file to the new one (keep the ring intact; don't leave any project's "next" link dangling).

3. **Add the grid-item link in `HTML/portfolio.html`** inside the matching category's `<div class="grid">`:
   ```html
   <a href="/HTML/Projects/project.html?id=<id>" class="grid-item">
     <img src="/HTML/Projects/images/<id>/hero.gif" alt="<title>">
     <div class="overlay-text"><title></div>
   </a>
   ```

**Critical**: the id used in the `projects.json` key, the `HTML/Projects/images/<id>/` folder name, and the `?id=` query param in `portfolio.html` must all match **exactly**, including case. A prior bug in this repo (`I-can-see-you` vs `i-can-see-you`) came from exactly this kind of mismatch — always lowercase the id everywhere.
