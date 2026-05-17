# Manual Testing Guide

Project: **SC-900 Concept Map Explorer**  
Baseline date: **2026-05-16**

## P0 — must pass before sharing
- [ ] `python -m http.server 8080` serves the app from the project root with no broken relative links.
- [ ] `index.html` loads `styles/main.css`, `src/app.js`, `data/concept-map.json`, and D3 via CDN.
- [ ] The graph renders domain, concept, and service nodes rather than a placeholder page.
- [ ] The footer reads `Built by Matthew Faber · source` and the source link targets the GitHub repo.
- [ ] Clicking a node highlights it and opens the sidebar with an authored definition, connected nodes, and citation links.
- [ ] The sidebar includes Microsoft Learn links when applicable.
- [ ] Search highlights a matching node and zooms the viewport to it.
- [ ] Filter chips correctly show only Security, Identity, and Compliance slices.
- [ ] Pin mode freezes the layout and Reset layout restores movement.
- [ ] No secrets, local-only files, or accidental build tooling were introduced.

## P1 — should pass before publishing updates
- [ ] The layout remains readable at 320px, 768px, and 1440px widths.
- [ ] Interactive controls have visible focus states and are touch-friendly.
- [ ] Chrome and Edge show no console errors on initial load.
- [ ] Dark mode toggle updates the UI without breaking graph readability.
- [ ] The legend clearly distinguishes domain, concept, and service nodes.
- [ ] Visible citations remain present even before a node is selected.
- [ ] README instructions match the current file structure and no-build workflow.
- [ ] The app still feels lightweight enough for GitHub Pages and repo review.

## P2 — follow-up checks
- [ ] A future screenshot can still be added without changing the local-run contract.
- [ ] Graph copy continues to keep Entra, Defender, Sentinel, Purview, and compliance concepts distinct.
- [ ] Search, filtering, and sidebar detail remain more prominent than decorative motion.
- [ ] `data/concept-map.json` stays human-readable for future review and edits.
- [ ] The repo remains understandable when opening it for the first time.
