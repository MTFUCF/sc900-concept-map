# Copilot instructions for SC-900 Concept Map Explorer

SC-900 Concept Map Explorer is a focused cybersecurity portfolio project owned by Matthew Faber. The goal is straightforward: A D3-powered concept map that helps learners explore relationships between SC-900 services, capabilities, and exam themes without hiding the implementation behind a build chain. Deployment target is GitHub Pages. The stack is HTML5, CSS3, Vanilla JavaScript, D3.js via CDN, GitHub Pages. Keep the repo easy to review, easy to explain in an interview, and easy to deploy from a clean branch.

When helping here, bias toward the smallest useful implementation. Preserve the deliberate no-build-step approach for the frontend. If the project uses Azure Functions, keep Node tooling isolated to `api/` and do not introduce root-level package management. Prefer plain HTML, CSS, and vanilla JavaScript that reads clearly.

What Copilot should help with:
- Improve D3 interaction patterns such as hover states, pan and zoom, and detail panes while keeping the data legible.
- Keep the concept graph data easy to inspect and edit in plain files.
- Optimize the layout for readability before adding any new visual complexity.

Domain guardrail: This project should explain relationships clearly: Azure AD/Entra, Defender, Purview, Sentinel, and compliance topics need precise separation even in a visual map. Treat copy, labels, and examples as reviewable cybersecurity content, not filler text.

What to avoid:
- Do not add a bundler just to use D3; load it by CDN for this project.
- Do not collapse distinct Microsoft concepts into vague umbrella labels.
- Do not over-animate the graph at the cost of clarity.

Keep README examples, testing steps, and placeholder UI text aligned whenever scope changes. This project has no secret-bearing runtime configuration in-repo. If you add data files later, keep them human-readable and stable so Matthew or another reviewer can audit the content without reverse engineering generated output.
