# SC-900 Concept Map Explorer

An interactive static concept map that connects SC-900 security, identity, and compliance ideas to real Microsoft services.

## What it is

This project is a buildless D3 application meant for GitHub Pages and recruiter-friendly repo review. Open it in a browser and explore how concepts like Zero Trust, Conditional Access, DLP, eDiscovery, SIEM, and Identity Governance relate to Microsoft Entra, Defender, Sentinel, Purview, Intune, and supporting services.

## Feature highlights

- Force-directed graph that fills most of the viewport
- Filter chips for **Security**, **Identity**, and **Compliance**
- Search that highlights a node and zooms to it
- Detail sidebar with authored definitions, connected nodes, and Microsoft Learn links
- Legend by node type, pin mode, reset layout, and dark mode toggle
- Visible citations referencing Microsoft Learn plus authored graph data from the local service dataset

## Live demo

https://matthewfaber.github.io/sc900-concept-map/

## How to run locally

```bash
cd projects/sc900-concept-map
python -m http.server 8080
```

Then browse to `http://localhost:8080/`.

## Push to GitHub

This project ships as its own standalone repo. To push it to a GitHub account (e.g., a separate cybersecurity-portfolio account), follow these steps.

### 1) Authenticate with the target account

Preferred: use GitHub CLI multi-account auth.

```bash
gh auth login
gh auth switch
gh auth status
```

Per-repo git config keeps commits under the right identity even if your global git config points at another account:

```bash
git config user.name "Matthew Faber"
git config user.email "<your-github-username>@users.noreply.github.com"
```

The noreply email keeps your personal email private. Replace `<your-github-username>` with the target account username.

### 2) Initialize, commit, and push

From the workspace root:

```bash
cd projects/sc900-concept-map
git init -b main
git config user.name "Matthew Faber"
git config user.email "<your-github-username>@users.noreply.github.com"
git add .
git commit -m "Initial commit"
gh repo create <your-github-username>/sc900-concept-map --public --source=. --remote=origin --push --description "An interactive static concept map that connects SC-900 security, identity, and compliance ideas to real Microsoft services."
```

### 3) Enable GitHub Pages

- Go to repo **Settings → Pages**.
- Under **Build and deployment**, set **Source** to **GitHub Actions** (not **Deploy from a branch**).
- The first push triggers `.github/workflows/deploy-pages.yml`; wait about 30 seconds, then visit `https://<your-github-username>.github.io/sc900-concept-map/`.

### 4) Updating later

```bash
git add . && git commit -m "Describe the change" && git push
```

## Deploy your own

This repo includes `.github/workflows/deploy-pages.yml` for the modern GitHub-native Pages flow.

1. Push the repo to GitHub.
2. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or run the workflow manually with **workflow_dispatch**.
4. After the workflow finishes, open `https://<your-github-username>.github.io/sc900-concept-map/`.

## Tech stack

- HTML5
- CSS custom properties
- Vanilla JavaScript
- D3.js via CDN
- JSON graph data
- GitHub Pages

## Data sources

- Authored graph data lives in `data/concept-map.json`
- Service grounding comes from `projects/_content-drops/ms-security-products.json`
- Product and concept citations point to Microsoft Learn pages surfaced in the UI

## Project structure

```text
.
├── .github/
│   └── copilot-instructions.md
├── data/
│   └── concept-map.json
├── src/
│   └── app.js
├── styles/
│   └── main.css
├── README.md
├── TESTING.md
└── index.html
```

## Local validation

1. Start a static server from the project root.
2. Confirm `index.html`, `styles/main.css`, `src/app.js`, and `data/concept-map.json` load with no broken relative paths.
3. Exercise filters, search, pin mode, reset layout, and dark mode.

Detailed checks live in [TESTING.md](./TESTING.md).

## Author

**Matthew Faber**  
Matthew Faber builds hands-on cybersecurity portfolio projects.


