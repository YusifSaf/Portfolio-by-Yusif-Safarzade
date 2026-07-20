import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "JS/p5.min.js",
      "p5backup/**",
      "HTML/Projects/versionBeforeIframeBackup/**",
      "HTML/Projects/Images1/**",
      "HTML/Projects/1portfolioWebsite.html",
      "HTML/Projects/2fieldHandbook.html",
    ],
  },
  js.configs.recommended,
  {
    // JS/script.js imports THREE and gsap as ES modules; Lenis and Howler
    // are loaded as plain <script> tags in index.html, so they're globals here.
    files: ["JS/script.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        Howl: "readonly",
        Lenis: "readonly",
      },
    },
  },
  {
    // project.js loads gsap/ScrollTrigger/Lenis as plain <script> tags in
    // project.html, so they're globals rather than imports here.
    files: ["HTML/Projects/project.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        gsap: "readonly",
        ScrollTrigger: "readonly",
        Lenis: "readonly",
      },
    },
  },
  {
    // one-off Node script used to scaffold project image folders
    files: ["HTML/Projects/images/make-folders.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
];
