const DOMAIN_ORDER = ["Security", "Identity", "Compliance"];
const TYPE_LABELS = {
  domain: "Domain",
  concept: "Concept",
  service: "Microsoft service"
};

const state = {
  activeDomains: new Set(DOMAIN_ORDER),
  searchTerm: "",
  matchedIds: new Set(),
  selectedNodeId: null,
  pinMode: false,
  nodes: [],
  links: [],
  adjacency: new Map(),
  simulation: null,
  zoom: null,
  width: 0,
  height: 0
};

const elements = {
  svg: document.getElementById("graph-svg"),
  graphHost: document.getElementById("graph"),
  sidebar: document.getElementById("detail-panel"),
  status: document.getElementById("status-text"),
  search: document.getElementById("node-search"),
  chips: [...document.querySelectorAll(".chip")],
  pinToggle: document.getElementById("pin-toggle"),
  reset: document.getElementById("reset-layout"),
  themeToggle: document.getElementById("theme-toggle")
};

const svg = d3.select(elements.svg);
const root = svg.append("g").attr("class", "viewport");
const linksLayer = root.append("g").attr("class", "links");
const labelsLayer = root.append("g").attr("class", "labels");
const nodesLayer = root.append("g").attr("class", "nodes");

let linkSelection = linksLayer.selectAll("line");
let labelSelection = labelsLayer.selectAll("text");
let nodeSelection = nodesLayer.selectAll("g");

initializeTheme();
wireControls();
loadGraph();

async function loadGraph() {
  try {
    const response = await fetch("./data/concept-map.json");
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    state.nodes = data.nodes.map((node) => ({
      ...node,
      primaryDomain: node.domains[0],
      radius: getRadius(node.type)
    }));
    state.links = data.links.map((link) => ({ ...link }));
    state.adjacency = buildAdjacency(state.links);

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(elements.graphHost);

    buildGraph();
    updateSize();
    renderSidebar();
    applyState();
  } catch (error) {
    elements.sidebar.innerHTML = `<h2>Could not load the concept map</h2><p>${error.message}</p>`;
  }
}

function wireControls() {
  elements.chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const domain = chip.dataset.domain;
      toggleDomain(domain);
    });
  });

  elements.search.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim().toLowerCase();
    applyState();

    const firstMatch = getVisibleMatches()[0];
    if (firstMatch) {
      selectNode(firstMatch.id, { zoom: true });
    }
  });

  elements.pinToggle.addEventListener("click", () => {
    setPinMode(!state.pinMode);
  });

  elements.reset.addEventListener("click", resetLayout);

  elements.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  });
}

function initializeTheme() {
  const stored = window.localStorage.getItem("sc900-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(stored || (prefersDark ? "dark" : "light"));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("sc900-theme", theme);
  elements.themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  elements.themeToggle.classList.toggle("is-active", theme === "dark");
  elements.themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
}

function buildGraph() {
  state.zoom = d3.zoom().scaleExtent([0.45, 2.5]).on("zoom", (event) => {
    root.attr("transform", event.transform);
  });
  svg.call(state.zoom);

  linkSelection = linksLayer
    .selectAll("line")
    .data(state.links, (d) => `${d.source}-${d.target}`)
    .join("line")
    .attr("class", "link");

  nodeSelection = nodesLayer
    .selectAll("g")
    .data(state.nodes, (d) => d.id)
    .join((enter) => {
      const group = enter
        .append("g")
        .attr("class", (d) => `node node--${d.type}`)
        .attr("role", "button")
        .attr("tabindex", 0)
        .attr("aria-label", (d) => `${d.name} (${TYPE_LABELS[d.type]})`)
        .on("click", (_, d) => selectNode(d.id, { zoom: true }))
        .on("keydown", (event, d) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectNode(d.id, { zoom: true });
          }
        })
        .call(enableDrag());

      group.append("circle").attr("class", "node-hit").attr("r", (d) => Math.max(24, d.radius + 10));
      group.append("circle").attr("class", "node-core").attr("r", (d) => d.radius);
      return group;
    });

  labelSelection = labelsLayer
    .selectAll("text")
    .data(state.nodes, (d) => d.id)
    .join("text")
    .attr("class", "label")
    .attr("font-size", (d) => (d.type === "domain" ? 16 : 13))
    .text((d) => d.name);

  state.simulation = d3
    .forceSimulation(state.nodes)
    .force("link", d3.forceLink(state.links).id((d) => d.id).distance(linkDistance).strength(0.22))
    .force("charge", d3.forceManyBody().strength((d) => (d.type === "domain" ? -1200 : -520)))
    .force("collision", d3.forceCollide().radius((d) => d.radius + 18))
    .force("x", d3.forceX((d) => domainX(d.primaryDomain)).strength(0.13))
    .force("y", d3.forceY((d) => typeY(d.type)).strength(0.14))
    .force("center", d3.forceCenter(0, 0))
    .on("tick", ticked);
}

function updateSize() {
  const bounds = elements.graphHost.getBoundingClientRect();
  state.width = Math.max(320, bounds.width);
  state.height = Math.max(420, bounds.height);
  svg.attr("viewBox", `${-state.width / 2} ${-state.height / 2} ${state.width} ${state.height}`);

  if (state.simulation) {
    state.simulation.force("x", d3.forceX((d) => domainX(d.primaryDomain)).strength(0.13));
    state.simulation.force("y", d3.forceY((d) => typeY(d.type)).strength(0.14));
    state.simulation.alpha(0.6).restart();
  }
}

function ticked() {
  linkSelection
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  nodeSelection.attr("transform", (d) => `translate(${d.x},${d.y})`);

  labelSelection
    .attr("x", (d) => d.x + d.radius + 8)
    .attr("y", (d) => d.y + 4);
}

function applyState() {
  const visibleIds = new Set(
    state.nodes
      .filter((node) => node.domains.some((domain) => state.activeDomains.has(domain)))
      .map((node) => node.id)
  );

  state.matchedIds = new Set(getVisibleMatches().map((node) => node.id));

  nodeSelection
    .classed("is-hidden", (d) => !visibleIds.has(d.id))
    .classed("is-selected", (d) => d.id === state.selectedNodeId)
    .classed("is-match", (d) => state.searchTerm !== "" && state.matchedIds.has(d.id))
    .classed("is-pinned", (d) => state.pinMode && d.fx != null && d.fy != null);

  labelSelection
    .classed("is-hidden", (d) => !visibleIds.has(d.id))
    .classed("is-match", (d) => state.searchTerm !== "" && state.matchedIds.has(d.id));

  linkSelection
    .classed("is-hidden", (d) => !visibleIds.has(d.source.id) || !visibleIds.has(d.target.id))
    .classed("is-highlight", (d) => isSelectedLink(d));

  elements.chips.forEach((chip) => {
    const active = state.activeDomains.has(chip.dataset.domain);
    chip.classList.toggle("is-active", active);
    chip.setAttribute("aria-pressed", String(active));
  });

  const visibleCount = visibleIds.size;
  const totalCount = state.nodes.length;
  const matchCount = state.matchedIds.size;
  elements.status.textContent = `${visibleCount} of ${totalCount} nodes visible${matchCount ? ` · ${matchCount} search match${matchCount === 1 ? "" : "es"}` : ""}`;

  const selectedNode = state.nodes.find((node) => node.id === state.selectedNodeId);
  if (selectedNode && !visibleIds.has(selectedNode.id)) {
    state.selectedNodeId = null;
    renderSidebar();
  } else if (selectedNode) {
    renderSidebar(selectedNode);
  }
}

function toggleDomain(domain) {
  if (state.activeDomains.has(domain) && state.activeDomains.size === 1) {
    state.activeDomains = new Set(DOMAIN_ORDER);
  } else if (state.activeDomains.has(domain)) {
    state.activeDomains.delete(domain);
  } else {
    state.activeDomains.add(domain);
  }

  applyState();
}

function selectNode(nodeId, options = {}) {
  state.selectedNodeId = nodeId;
  const node = state.nodes.find((item) => item.id === nodeId);
  renderSidebar(node);
  applyState();

  if (options.zoom && node) {
    zoomToNode(node);
  }
}

function renderSidebar(node) {
  if (!node) {
    elements.sidebar.innerHTML = `
      <p class="sidebar-eyebrow">Details</p>
      <h2>Explore the graph</h2>
      <p class="empty-state">Click a domain, concept, or service node to inspect its definition, connected ideas, and Microsoft Learn references.</p>
      <div class="sidebar-section">
        <p class="sidebar-eyebrow">How to use it</p>
        <ul>
          <li>Filter by Security, Identity, or Compliance to simplify the layout.</li>
          <li>Use search to highlight a matching node and zoom directly to it.</li>
          <li>Turn on pin mode to freeze the current layout before comparing concepts.</li>
        </ul>
      </div>
      <div class="sidebar-section">
        <p class="sidebar-eyebrow">Visible sources</p>
        <div class="sources-list">
          <a class="badge" href="https://learn.microsoft.com/en-us/security/zero-trust/" target="_blank" rel="noreferrer">Zero Trust</a>
          <a class="badge" href="https://learn.microsoft.com/en-us/entra/identity/" target="_blank" rel="noreferrer">Entra ID</a>
          <a class="badge" href="https://learn.microsoft.com/en-us/defender-xdr/" target="_blank" rel="noreferrer">Defender XDR</a>
          <a class="badge" href="https://learn.microsoft.com/en-us/azure/sentinel/" target="_blank" rel="noreferrer">Sentinel</a>
          <a class="badge" href="https://learn.microsoft.com/en-us/purview/purview" target="_blank" rel="noreferrer">Purview</a>
        </div>
        <p>Service nodes were authored from <code>projects/_content-drops/ms-security-products.json</code> and mapped to Microsoft Learn product pages.</p>
      </div>
    `;
    return;
  }

  const connected = getConnectedNodes(node.id);
  const typeBadgeClass = `badge badge-${node.type}`;
  const domainBadges = node.domains.map((domain) => `<span class="badge badge-domain">${domain}</span>`).join("");
  const learnLink = node.learnUrl
    ? `<a class="badge" href="${node.learnUrl}" target="_blank" rel="noreferrer">Microsoft Learn</a>`
    : "<span class=\"badge\">No direct Learn link</span>";

  elements.sidebar.innerHTML = `
    <p class="sidebar-eyebrow">Selected node</p>
    <h2>${node.name}</h2>
    <div class="badge-row">
      <span class="${typeBadgeClass}">${TYPE_LABELS[node.type]}</span>
      ${domainBadges}
    </div>
    <p>${node.definition}</p>
    <div class="sidebar-section">
      <p class="sidebar-eyebrow">Connected nodes</p>
      <div class="connected-list">
        ${
          connected.length
            ? connected
                .map(
                  (item) =>
                    `<button class="connected-button" type="button" data-node-id="${item.id}">${item.name}</button>`
                )
                .join("")
            : "<p>No connected nodes.</p>"
        }
      </div>
    </div>
    <div class="sidebar-section">
      <p class="sidebar-eyebrow">Citations</p>
      <div class="sources-list">
        ${learnLink}
        <a class="badge" href="https://github.com/matthewfaber/sc900-concept-map" target="_blank" rel="noreferrer">Project source</a>
      </div>
    </div>
  `;

  elements.sidebar.querySelectorAll("[data-node-id]").forEach((button) => {
    button.addEventListener("click", () => selectNode(button.dataset.nodeId, { zoom: true }));
  });
}

function setPinMode(enabled) {
  state.pinMode = enabled;
  elements.pinToggle.classList.toggle("is-active", enabled);
  elements.pinToggle.setAttribute("aria-pressed", String(enabled));
  elements.pinToggle.textContent = enabled ? "Pin mode on" : "Pin mode off";

  state.nodes.forEach((node) => {
    if (enabled) {
      node.fx = node.x;
      node.fy = node.y;
    } else {
      node.fx = null;
      node.fy = null;
    }
  });

  state.simulation.alpha(enabled ? 0.2 : 0.7).restart();
  applyState();
}

function resetLayout() {
  state.activeDomains = new Set(DOMAIN_ORDER);
  state.searchTerm = "";
  state.matchedIds = new Set();
  state.selectedNodeId = null;
  elements.search.value = "";

  if (state.pinMode) {
    setPinMode(false);
  }

  state.nodes.forEach((node) => {
    node.fx = null;
    node.fy = null;
  });

  svg.transition().duration(450).call(state.zoom.transform, d3.zoomIdentity);
  state.simulation.alpha(1).restart();
  renderSidebar();
  applyState();
}

function zoomToNode(node) {
  const scale = node.type === "domain" ? 0.85 : 1.15;
  const transform = d3.zoomIdentity.translate(-node.x * scale, -node.y * scale).scale(scale);
  svg.transition().duration(450).call(state.zoom.transform, transform);
}

function getConnectedNodes(nodeId) {
  return [...(state.adjacency.get(nodeId) || [])]
    .map((id) => state.nodes.find((node) => node.id === id))
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getVisibleMatches() {
  if (!state.searchTerm) {
    return [];
  }

  return state.nodes.filter(
    (node) =>
      node.domains.some((domain) => state.activeDomains.has(domain)) &&
      node.name.toLowerCase().includes(state.searchTerm)
  );
}

function buildAdjacency(links) {
  const adjacency = new Map();

  links.forEach((link) => {
    if (!adjacency.has(link.source)) {
      adjacency.set(link.source, new Set());
    }
    if (!adjacency.has(link.target)) {
      adjacency.set(link.target, new Set());
    }
    adjacency.get(link.source).add(link.target);
    adjacency.get(link.target).add(link.source);
  });

  return adjacency;
}

function isSelectedLink(link) {
  if (!state.selectedNodeId) {
    return false;
  }

  return link.source.id === state.selectedNodeId || link.target.id === state.selectedNodeId;
}

function enableDrag() {
  return d3
    .drag()
    .on("start", (event, node) => {
      if (!event.active) {
        state.simulation.alphaTarget(0.25).restart();
      }
      node.fx = node.x;
      node.fy = node.y;
    })
    .on("drag", (event, node) => {
      node.fx = event.x;
      node.fy = event.y;
    })
    .on("end", (event, node) => {
      if (!event.active) {
        state.simulation.alphaTarget(0);
      }
      if (!state.pinMode) {
        node.fx = null;
        node.fy = null;
      }
      applyState();
    });
}

function linkDistance(link) {
  const sourceType = typeof link.source === "object" ? link.source.type : state.nodes.find((node) => node.id === link.source)?.type;
  const targetType = typeof link.target === "object" ? link.target.type : state.nodes.find((node) => node.id === link.target)?.type;
  const combo = [sourceType, targetType].sort().join("-");

  switch (combo) {
    case "concept-domain":
      return 130;
    case "concept-service":
      return 110;
    case "domain-service":
      return 155;
    case "concept-concept":
      return 90;
    case "service-service":
      return 85;
    default:
      return 105;
  }
}

function domainX(primaryDomain) {
  const positions = {
    Security: -state.width * 0.24,
    Identity: 0,
    Compliance: state.width * 0.24
  };
  return positions[primaryDomain] ?? 0;
}

function typeY(type) {
  const positions = {
    domain: -state.height * 0.26,
    concept: -state.height * 0.02,
    service: state.height * 0.26
  };
  return positions[type] ?? 0;
}

function getRadius(type) {
  switch (type) {
    case "domain":
      return 24;
    case "concept":
      return 16;
    default:
      return 12;
  }
}
