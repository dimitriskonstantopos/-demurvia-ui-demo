(() => {
  "use strict";

  const data = window.DEMURVIA_DEMO_DATA;
  const page = document.getElementById("page");
  const demoProfileName = data.operator;
  const demoProfileInitials = demoProfileName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const state = {
    activeClaimId: data.claims[0].id,
    commandTab: "overview",
    termsTab: "Laytime allowance",
    analyticsPeriod: "90d",
    timelineIndex: 0,
    documentStates: Object.fromEntries(data.documents.map((item) => [item.id, item.status])),
    extractionStates: {},
    taskStates: Object.fromEntries(data.tasks.map((item) => [item.id, item.done])),
    showFinancials: true,
    compactMode: false,
    navOpen: false,
    workspaceMenuOpen: false,
    notificationsOpen: false,
    profileMenuOpen: false,
  };
  const demoNotifications = [
    {
      title: "Sample document ready for review",
      detail: `${data.documents[0].name} · ${data.claims.find((claim) => claim.id === data.documents[0].claimId)?.id ?? "Synthetic claim"}`,
      time: data.documents[0].received,
    },
    {
      title: "Fictional claim updated",
      detail: `${data.claims[1].vessel} · ${data.claims[1].id}`,
      time: data.claims[1].updated,
    },
  ];

  const pageNames = {
    dashboard: "Dashboard",
    claims: "Claims Management",
    "command-center": "Claim Command Center",
    documents: "Documents Workspace",
    extraction: "Extraction Workspace",
    "contract-terms": "Contract Terms",
    "laytime-calculation": "Laytime Calculation",
    analytics: "Analytics",
    "deadlines-tasks": "Deadlines & Tasks",
    settings: "Settings",
  };

  const icons = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    claims: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h5M10 13h6M10 17h6"/>',
    command: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2M4 4l2 2M20 4l-2 2"/>',
    documents: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h5M10 13h6M10 17h6"/>',
    extraction: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h3M8 16h8M15 11l2 2 3-4"/>',
    terms: '<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    calculation: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
    analytics: '<path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/>',
    tasks: '<path d="m4 7 2 2 3-4M11 7h9M4 16l2 2 3-4M11 16h9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    file: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    alert: '<path d="m12 3 9 17H3z"/><path d="M12 9v4M12 17h.01"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 20h14"/>',
  };

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const icon = (name, extraClass = "") => `<svg class="${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name] ?? icons.file}</svg>`;
  const money = (amount, currency = "USD") => state.showFinancials
    ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
    : "••••••";
  const activeClaim = () => data.claims.find((claim) => claim.id === state.activeClaimId) ?? data.claims[0];
  const calcFor = (claimId) => data.calculations.find((item) => item.claimId === claimId);
  const eventsFor = (claimId) => data.events.filter((item) => item.claimId === claimId);
  const docsFor = (claimId) => data.documents.filter((item) => item.claimId === claimId);
  const statusTone = (status) => {
    if (/review|ready/i.test(status)) return "status-blue";
    if (/reviewed|complete|done/i.test(status)) return "status-green";
    if (/needed|pending|draft/i.test(status)) return "status-amber";
    return "status-gray";
  };
  const status = (label) => `<span class="status ${statusTone(label)}">${esc(label)}</span>`;
  const claimName = (claim) => `<span class="claim-primary"><strong>${esc(claim.vessel)}</strong><small>${esc(claim.id)} · ${esc(claim.voyage)}</small></span>`;
  const note = (copy = "All figures and terms on this page are illustrative examples only; they are not an authoritative calculation or approval.") =>
    `<div class="illustrative-note" data-testid="illustrative-disclosure">${icon("alert")}<span><strong>Illustrative only.</strong> ${esc(copy)}</span></div>`;
  const title = (section, heading, description, actions = "") =>
    `<div class="page-heading"><div class="page-heading-copy"><div class="eyebrow">${esc(section)}</div><h1>${esc(heading)}</h1><p>${esc(description)}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ""}</div>`;
  const panelHeading = (heading, subtitle = "", action = "") =>
    `<div class="panel-header"><div><h2 class="panel-title">${esc(heading)}</h2>${subtitle ? `<p class="panel-subtitle">${esc(subtitle)}</p>` : ""}</div>${action}</div>`;
  const metric = (label, value, foot, iconName) =>
    `<article class="metric-card" data-testid="metric-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}"><div class="metric-label"><span>${esc(label)}</span><span class="metric-symbol">${icon(iconName)}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></article>`;

  function claimRows(claims) {
    return claims.map((claim) => `
      <tr data-filter-row="claims" data-search-text="${esc(`${claim.id} ${claim.reference} ${claim.vessel} ${claim.voyage} ${claim.counterparty} ${claim.port} ${claim.status}`.toLowerCase())}" data-status="${esc(claim.status)}">
        <td><a class="claim-link" href="#/command-center" data-route="command-center" data-select-claim="${esc(claim.id)}" data-testid="link-claim-${esc(claim.id)}">${claimName(claim)}</a></td>
        <td>${esc(claim.counterparty)}</td>
        <td>${esc(claim.port)}</td>
        <td>${status(claim.status)}</td>
        <td class="nowrap">${esc(claim.updated)}</td>
        <td class="nowrap">${money(claim.illustrativeAmount, claim.currency)}</td>
      </tr>`).join("");
  }

  function claimCards(claims) {
    return claims.map((claim) => `
      <article class="claim-card" data-filter-row="claims" data-search-text="${esc(`${claim.id} ${claim.reference} ${claim.vessel} ${claim.voyage} ${claim.counterparty} ${claim.port} ${claim.status}`.toLowerCase())}" data-status="${esc(claim.status)}" data-testid="claim-card-${esc(claim.id)}">
        <div class="claim-card-heading">
          <div><a class="claim-card-vessel" href="#/command-center" data-route="command-center" data-select-claim="${esc(claim.id)}">${esc(claim.vessel)}</a><span class="claim-card-reference">Claim reference · ${esc(claim.reference)}</span></div>
          ${status(claim.status)}
        </div>
        <dl class="claim-card-details">
          <div><dt>Claim ID</dt><dd>${esc(claim.id)}</dd></div>
          <div><dt>Voyage</dt><dd>${esc(claim.voyage)}</dd></div>
          <div><dt>Counterparty</dt><dd>${esc(claim.counterparty)}</dd></div>
          <div><dt>Port / terminal</dt><dd>${esc(claim.port)}</dd></div>
          <div><dt>Updated</dt><dd>${esc(claim.updated)}</dd></div>
          <div><dt>Illustrative amount</dt><dd>${money(claim.illustrativeAmount, claim.currency)}</dd></div>
        </dl>
        <a class="button button-small claim-card-open" href="#/command-center" data-route="command-center" data-select-claim="${esc(claim.id)}" data-testid="button-open-claim-${esc(claim.id)}">Open claim ${icon("arrow")}</a>
      </article>`).join("");
  }

  function claimsTable(claims, includeFilters = false) {
    const controls = includeFilters
      ? `<div class="table-tools"><label class="search-field">${icon("search")}<input type="search" placeholder="Search claims" aria-label="Search claims" data-search="claims" data-testid="input-search-claims"></label><label class="select-field"><span class="inline-label">Status</span><select aria-label="Filter claims by status" data-status-filter="claims" data-testid="select-claim-status"><option value="">All statuses</option><option>In review</option><option>Documents needed</option><option>Ready to review</option><option>Draft</option></select></label></div>`
      : `<a class="button button-quiet button-small" href="#/claims" data-route="claims" data-testid="link-all-claims">View all ${icon("arrow")}</a>`;
    return `<section class="panel" data-filter-scope="claims">
      ${panelHeading("Claims register", includeFilters ? "Four fictional examples" : "Recently updated synthetic examples", controls)}
      <div class="table-scroll"><table><thead><tr><th>Vessel / claim</th><th>Counterparty</th><th>Port / terminal</th><th>Status</th><th>Updated</th><th>Illustrative amount</th></tr></thead><tbody>${claimRows(claims)}</tbody></table></div>
      <div class="claim-card-list" aria-label="Claims register cards">${claimCards(claims)}</div>
      <div class="empty-state" data-empty-for="claims">No sample claims match these filters.</div>
    </section>`;
  }

  function renderDashboard() {
    const amount = data.claims.reduce((sum, claim) => sum + claim.illustrativeAmount, 0);
    const recent = [...data.claims].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 4);
    return `${title("OPERATIONS OVERVIEW", "Good morning, Elena", "A sample view of vessel claims, review progress, and upcoming work.", `<a class="button button-primary" href="#/claims" data-route="claims" data-testid="button-open-claims">${icon("claims")} Open claims</a>`)}
      ${note("Fictional claims and illustrative amounts are provided to demonstrate the interface only.")}
      <div class="grid metric-grid">
        ${metric("Sample claims", String(data.claims.length).padStart(2, "0"), "<strong>4 fictional voyages</strong> in this workspace", "claims")}
        ${metric("Awaiting review", "02", "Example document and terms review", "clock")}
        ${metric("Illustrative exposure", money(amount), "Synthetic sample values only", "analytics")}
        ${metric("Open tasks", String(data.tasks.filter((task) => !task.done).length).padStart(2, "0"), "Session-only checklist", "tasks")}
      </div>
      <div class="grid dashboard-grid">
        <div class="section-stack">${claimsTable(recent)}<section class="panel">${panelHeading("Port activity", "Synthetic sample timeline")}<div class="panel-body">${activityList(data.events.slice(0, 4))}</div></section></div>
        <div class="section-stack"><section class="panel">${panelHeading("Review queue", "Example items for visual review")}<div class="panel-body">${reviewQueue()}</div></section><section class="panel">${panelHeading("Next deadlines", "Fictional schedule")}<div class="panel-body">${deadlinePreview()}</div></section></div>
      </div>`;
  }

  function activityList(events) {
    return `<div class="activity-list">${events.map((event) => `
      <div class="activity-item" data-testid="activity-${esc(event.type.toLowerCase())}">
        <span class="activity-icon">${icon(event.type === "NOR" ? "file" : "clock")}</span>
        <span class="activity-copy"><strong>${esc(event.title)}</strong><small>${esc(event.detail)}</small></span>
        <time class="activity-time">${esc(event.time.split(" · ")[0])}</time>
      </div>`).join("")}</div>`;
  }

  function reviewQueue() {
    return `<div class="activity-list">${data.documents.filter((doc) => state.documentStates[doc.id] === "Needs review").slice(0, 3).map((doc) => `
      <div class="activity-item"><span class="activity-icon">${icon("documents")}</span><span class="activity-copy"><strong>${esc(doc.name)}</strong><small>${esc(doc.category)} · ${esc(doc.claimId)}</small></span><a class="claim-link" href="#/documents" data-route="documents" data-testid="link-review-sample">View</a></div>`).join("") || `<p class="panel-subtitle">No sample documents are waiting for review.</p>`}</div>
      <div class="session-note">Example review states are temporary and reset when the page is refreshed.</div>`;
  }

  function deadlinePreview() {
    return `<div class="activity-list">${data.tasks.slice(0, 2).map((task) => `
      <div class="activity-item"><span class="activity-icon">${icon("clock")}</span><span class="activity-copy"><strong>${esc(task.title)}</strong><small>${esc(task.claimId)}</small></span><time class="activity-time">${esc(task.due)}</time></div>`).join("")}</div>
      <a class="button button-quiet button-small" href="#/deadlines-tasks" data-route="deadlines-tasks" data-testid="link-open-tasks">Open task list ${icon("arrow")}</a>`;
  }

  function renderClaims() {
    return `${title("CLAIMS OPERATIONS", "Claims Management", "Search, filter, and open fictional tanker demurrage examples.", `<button class="button button-primary" type="button" data-action="toast" data-message="Creating live claims is disabled in this static demo." data-testid="button-create-claim">${icon("claims")} New claim</button>`)}
      ${note("All claim names, counterparties, statuses, and amounts are fictional.")}
      ${claimsTable(data.claims, true)}`;
  }

  function commandTabs() {
    return `<div class="tab-list" role="tablist" aria-label="Claim command center views">
      ${[["overview", "Overview"], ["timeline", "Timeline"], ["documents", "Documents"]].map(([key, label]) =>
        `<button class="tab-button" type="button" role="tab" aria-selected="${state.commandTab === key}" data-action="command-tab" data-value="${key}" data-testid="tab-command-${key}">${label}</button>`).join("")}
    </div>`;
  }

  function timelineFor(claimId, interactive = false) {
    const events = eventsFor(claimId);
    if (!events.length) return `<div class="session-note">No synthetic events are attached to this example.</div>`;
    const selected = Math.min(state.timelineIndex, events.length - 1);
    return `${interactive ? `<div class="section-title-row timeline-heading"><div class="timeline-heading-copy"><h2>Sample voyage timeline</h2><p>Use the controls to move through fictional event entries.</p></div><div class="timeline-controls"><button class="button button-small button-icon" type="button" data-action="timeline-step" data-direction="-1" aria-label="Previous timeline event" data-testid="button-timeline-previous">${icon("arrow")}</button><button class="button button-small button-icon" type="button" data-action="timeline-step" data-direction="1" aria-label="Next timeline event" data-testid="button-timeline-next">${icon("arrow")}</button></div></div>` : ""}
      <div class="timeline">${events.map((event, index) => `
        <article class="timeline-item ${index === selected ? "timeline-selected" : ""}" data-testid="timeline-event-${index + 1}">
          <time class="timeline-time">${esc(event.time)}</time><span class="timeline-track"><span class="timeline-dot"></span></span>
          <div class="timeline-copy"><strong>${esc(event.title)} <span class="event-type">${esc(event.type)}</span></strong><small>${esc(event.detail)}</small></div>
        </article>`).join("")}</div>
      ${interactive ? `<p class="panel-subtitle timeline-position" aria-live="polite">Showing event ${selected + 1} of ${events.length}</p>` : ""}`;
  }

  function detailTiles(claim) {
    return `<div class="detail-grid">
      <div class="detail-tile"><small>Vessel</small><strong>${esc(claim.vessel)}</strong><span>${esc(claim.voyage)}</span></div>
      <div class="detail-tile"><small>Counterparty</small><strong>${esc(claim.counterparty)}</strong><span>Fictional example</span></div>
      <div class="detail-tile"><small>Port / terminal</small><strong>${esc(claim.port)}</strong><span>Synthetic location</span></div>
      <div class="detail-tile"><small>Cargo</small><strong>${esc(claim.cargo)}</strong><span>Sample voyage</span></div>
      <div class="detail-tile"><small>Claim status</small><strong>${status(claim.status)}</strong><span>Demo state only</span></div>
      <div class="detail-tile"><small>Reference</small><strong class="mono">${esc(claim.reference)}</strong><span>Fictional identifier</span></div>
    </div>`;
  }

  function documentRows(documents, compact = false) {
    return `<div class="document-list">${documents.map((doc) => {
      const currentStatus = state.documentStates[doc.id] ?? doc.status;
      return `<article class="document-row" data-testid="document-${esc(doc.id)}">
        <span class="file-icon">${icon("file")}</span>
        <span class="document-copy"><strong>${esc(doc.name)}</strong><small>${esc(doc.category)} · ${esc(doc.pages)} sample pages · ${esc(doc.received)}</small></span>
        <span class="document-row-actions"><span class="review-state">${status(currentStatus)}</span>${compact ? "" : `<button class="button button-small" type="button" data-action="review-document" data-document-id="${esc(doc.id)}" data-testid="button-review-${esc(doc.id)}">${currentStatus === "Needs review" ? "Mark sample reviewed" : "Reset sample"}</button>`}</span>
      </article>`;
    }).join("")}</div>`;
  }

  function renderCommandCenter() {
    const claim = activeClaim();
    const calculation = calcFor(claim.id);
    let tabContent = "";
    if (state.commandTab === "timeline") tabContent = timelineFor(claim.id, true);
    else if (state.commandTab === "documents") tabContent = documentRows(docsFor(claim.id));
    else tabContent = `${detailTiles(claim)}<div class="section-title-row" style="margin-top:18px"><div><h2>Voyage events</h2><p>Sample NOR and statement-of-facts entries</p></div><a class="claim-link" href="#/laytime-calculation" data-route="laytime-calculation" data-testid="link-view-calculation">Illustrative calculation</a></div>${timelineFor(claim.id)}<details class="expand-card" data-testid="expand-sample-source-notes"><summary>Show fictional source notes</summary><p>Every vessel, counterparty, location, timestamp, term, and value on this screen is synthetic. These entries do not establish event validity or contractual authority.</p></details>`;
    return `${title("CLAIMS OPERATIONS", "Claim Command Center", "Explore a fictional claim overview, synthetic timeline, and sample documents.")}
      ${note("This command center is a visual example only. It does not determine authority, eligibility, or claim readiness.")}
      <div class="claim-select-row"><label class="field-control"><span class="inline-label">Choose a sample claim</span><select data-claim-select aria-label="Choose sample claim" data-testid="select-active-claim">${data.claims.map((item) => `<option value="${esc(item.id)}" ${item.id === claim.id ? "selected" : ""}>${esc(item.id)} · ${esc(item.vessel)}</option>`).join("")}</select></label>${status(claim.status)}</div>
      <section class="panel command-center-desktop">${panelHeading(`${esc(claim.id)} · ${esc(claim.vessel)}`, `${esc(claim.port)} · Updated ${esc(claim.updated)}`)}<div class="panel-body">${commandTabs()}<div class="tab-content">${tabContent}</div></div></section>
      <div class="command-center-mobile-stack" aria-label="Claim details">
        <section class="panel">${panelHeading("Claim overview", `${esc(claim.id)} · ${esc(claim.vessel)}`)}<div class="panel-body">${detailTiles(claim)}<details class="expand-card"><summary>Show fictional source notes</summary><p>Every vessel, counterparty, location, timestamp, term, and value on this screen is synthetic. These entries do not establish event validity or contractual authority.</p></details></div></section>
        <section class="panel">${panelHeading("Voyage timeline", `${esc(claim.vessel)} · synthetic events`)}<div class="panel-body">${timelineFor(claim.id, true)}</div></section>
        <section class="panel">${panelHeading("Illustrative calculation", "Synthetic example only")}<div class="panel-body">${calculation
          ? `<div class="result-card"><div class="result-kicker">${esc(calculation.resultLabel)}</div><div class="result-value">${money(calculation.result, calculation.currency)}</div><div class="result-caption">Illustrative value · not an authoritative result</div></div><div class="session-note">No calculation engine or claim decision is available in this static demo.</div>`
          : `<p class="panel-subtitle">No calculation example is attached to this fictional claim.</p>`}</div></section>
        <section class="panel">${panelHeading("Supporting documents", "Fictional sample records")}<div class="panel-body">${documentRows(docsFor(claim.id))}</div></section>
      </div>`;
  }

  function renderDocuments() {
    const docs = data.documents;
    return `${title("CLAIM EVIDENCE", "Documents Workspace", "Browse fictional sample records and try a local-only review interaction.")}
      ${note("These are descriptive demo entries; no real files, uploads, or evidence obligations are present.")}
      <section class="panel" data-filter-scope="documents">
        ${panelHeading("Sample document register", "All entries are synthetic", `<div class="table-tools"><label class="search-field">${icon("search")}<input type="search" placeholder="Search sample documents" aria-label="Search sample documents" data-search="documents" data-testid="input-search-documents"></label><label class="select-field"><select aria-label="Filter documents by review state" data-status-filter="documents" data-testid="select-document-status"><option value="">All review states</option><option>Needs review</option><option>Reviewed in demo</option></select></label></div>`)}
        <div class="panel-body"><div class="document-list">${docs.map((doc) => {
          const currentStatus = state.documentStates[doc.id] ?? doc.status;
          return `<article class="document-row" data-filter-row="documents" data-search-text="${esc(`${doc.name} ${doc.category} ${doc.claimId} ${currentStatus}`.toLowerCase())}" data-status="${esc(currentStatus)}" data-testid="document-${esc(doc.id)}">
            <span class="file-icon">${icon("file")}</span><span class="document-copy"><strong>${esc(doc.name)}</strong><small>${esc(doc.category)} · ${esc(doc.claimId)} · ${esc(doc.pages)} synthetic pages · ${esc(doc.received)}</small></span>
            <span class="document-row-actions"><span class="review-state">${status(currentStatus)}</span><button class="button button-small" type="button" data-action="review-document" data-document-id="${esc(doc.id)}" data-testid="button-review-${esc(doc.id)}">${currentStatus === "Needs review" ? "Mark sample reviewed" : "Reset sample"}</button></span>
          </article>`;
        }).join("")}</div><div class="empty-state" data-empty-for="documents">No sample documents match these filters.</div></div>
      </section>`;
  }

  function renderExtraction() {
    const claim = activeClaim();
    const chosenDoc = docsFor(claim.id)[0] ?? data.documents[0];
    const extracted = state.extractionStates[claim.id] ?? "Awaiting sample review";
    return `${title("DOCUMENT REVIEW", "Extraction Workspace", "Compare a fictional source preview with synthetic extracted fields.")}
      ${note("Sample field values are fabricated for layout testing. Nothing is extracted from a real document.")}
      <div class="claim-select-row"><label class="field-control"><span class="inline-label">Sample claim</span><select data-claim-select aria-label="Choose sample claim" data-testid="select-extraction-claim">${data.claims.map((item) => `<option value="${esc(item.id)}" ${item.id === claim.id ? "selected" : ""}>${esc(item.id)} · ${esc(item.vessel)}</option>`).join("")}</select></label></div>
      <div class="grid split-grid">
        <section class="panel">${panelHeading(esc(chosenDoc.name), `${esc(chosenDoc.category)} · fictional preview`)}<div class="panel-body"><div class="extract-preview" aria-label="Decorative synthetic document preview"><div class="paper-sheet"><div class="paper-kicker">SYNTHETIC SAMPLE · ${esc(claim.id)}</div><div class="paper-title">Statement of Facts</div><div class="paper-line med"></div><div class="paper-line"></div><div class="paper-line short"></div><div class="paper-highlight"></div><div class="paper-line"></div><div class="paper-line med"></div><div class="paper-line short"></div></div></div><div class="session-note">This visual sheet is decorative and does not contain or reproduce a real document.</div></div></section>
        <section class="panel">${panelHeading("Example extracted fields", "Synthetic values · no authority implied")}<div class="panel-body"><div class="extract-fields">
          ${[
            ["Vessel", claim.vessel], ["Voyage", claim.voyage], ["Port", claim.port],
            ["NOR tendered", "11 Jul 2026 · 06:00"], ["Cargo complete", "14 Jul 2026 · 23:25"],
            ["Counterparty", claim.counterparty],
          ].map(([label, value]) => `<div class="extract-field"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("")}
        </div><p class="session-note" data-testid="extraction-demo-state">${esc(extracted)} · this state exists only in memory.</p>
          <div class="heading-actions"><button class="button button-primary" type="button" data-action="extraction-mark" data-testid="button-mark-extraction">${icon("check")} Mark example reviewed</button><button class="button" type="button" data-action="extraction-reset" data-testid="button-reset-extraction">${icon("close")} Reset</button></div>
        </div></section>
      </div>`;
  }

  function renderTerms() {
    const groups = ["Laytime allowance", "Rate", "Exceptions"];
    const selected = state.termsTab;
    const terms = data.terms.filter((term) => term.group === selected);
    return `${title("CONTRACT REVIEW", "Contract Terms", "Explore a fictional recap summary and sample term groupings.")}
      ${note("These fictional terms are for interface demonstration only. They are not contractual authority or legal advice.")}
      <section class="panel">${panelHeading("Fictional charter recap", "Sample vessel · MV Meridian Crest · synthetic source references")}
        <div class="panel-body"><div class="detail-grid">
          <div class="detail-tile"><small>Sample claim</small><strong>DM-26041</strong><span>Fictional reference</span></div>
          <div class="detail-tile"><small>Sample voyage</small><strong>VOY-DEMO-041</strong><span>Port Vela · East Berth</span></div>
          <div class="detail-tile"><small>Review state</small><strong>${status("Illustrative sample")}</strong><span>No authority decision</span></div>
        </div>
        <div class="tab-list" role="tablist" aria-label="Example contract term groups" style="margin-top:18px">
          ${groups.map((group) => `<button class="tab-button" type="button" role="tab" aria-selected="${selected === group}" data-action="terms-tab" data-value="${esc(group)}" data-testid="tab-terms-${group.toLowerCase().replace(/\s+/g, "-")}">${esc(group)}</button>`).join("")}
        </div>
        <div class="term-list" role="tabpanel" aria-live="polite">${terms.map((term) => `<div class="term-row" data-testid="term-${term.term.toLowerCase().replace(/\s+/g, "-")}"><span class="term-name">${esc(term.term)}</span><strong class="term-value">${esc(term.value)}</strong><small class="term-source">${esc(term.source)}</small></div>`).join("")}</div>
        <div class="session-note">Term groups and references are synthetic. No contract is uploaded, parsed, or activated in this demo.</div>
        </div>
      </section>`;
  }

  function renderCalculation() {
    const claim = activeClaim();
    const calculation = calcFor(claim.id);
    const events = eventsFor(claim.id);
    return `${title("TIME ACCOUNTING", "Laytime Calculation", "Review a static example timeline and illustrative output.")}
      ${note("No calculation engine runs here. Example durations and amounts are synthetic and must not be used for a claim.")}
      <div class="claim-select-row"><label class="field-control"><span class="inline-label">Sample claim</span><select data-claim-select aria-label="Choose sample calculation" data-testid="select-calculation-claim">${data.claims.map((item) => `<option value="${esc(item.id)}" ${item.id === claim.id ? "selected" : ""}>${esc(item.id)} · ${esc(item.vessel)}</option>`).join("")}</select></label></div>
      ${calculation ? `<div class="grid metric-grid">
        ${metric("Sample rate / day", money(calculation.ratePerDay, calculation.currency), "Fictional recap example", "calculation")}
        ${metric("Allowed sample time", esc(calculation.allowed), "Illustrative term only", "clock")}
        ${metric("Counted sample time", esc(calculation.used), "Synthetic event sequence", "analytics")}
        ${metric("Sample difference", esc(calculation.difference), "Not an authoritative result", "alert")}
      </div>
      <div class="grid split-grid"><section class="panel">${panelHeading("Example event timeline", `${esc(claim.vessel)} · ${esc(claim.port)}`)}<div class="panel-body">${timelineFor(claim.id, true)}</div></section>
        <aside class="section-stack"><section class="panel">${panelHeading("Illustrative output", `Static example · ${esc(calculation.version)}`)}<div class="panel-body">
          <div class="result-card"><div class="result-kicker">${esc(calculation.resultLabel)}</div><div class="result-value" data-testid="illustrative-calculation-result">${money(calculation.result, calculation.currency)}</div><div class="result-caption">USD · synthetic sample value only</div></div>
          <div class="calc-steps"><div class="calc-step"><span>Sample daily rate</span><strong>${money(calculation.ratePerDay, calculation.currency)}</strong></div><div class="calc-step"><span>Sample time difference</span><strong>${esc(calculation.difference)}</strong></div><div class="calc-step"><span>Claim reference</span><strong>${esc(claim.reference)}</strong></div></div>
          <div class="session-note">No calculate, approve, reject, submit, or finalise operation is available.</div>
        </div></section><section class="panel">${panelHeading("Source context", "Fictional sample only")}<div class="panel-body">${detailTiles(claim)}</div></section></aside></div>`
      : `<section class="panel"><div class="panel-body"><div class="empty-state" style="display:block">This sample has no calculation view. Choose another fictional claim.</div></div></section>`}`;
  }

  function renderAnalytics() {
    const period = data.analytics[state.analyticsPeriod];
    const max = Math.max(...period.months.map((item) => item.value), 1);
    return `${title("PORTFOLIO VIEW", "Analytics", "Explore synthetic activity summaries with a local period filter.", `<label class="select-field"><span class="inline-label">Period</span><select data-analytics-period aria-label="Choose analytics period" data-testid="select-analytics-period">${Object.entries(data.analytics).map(([key, item]) => `<option value="${key}" ${state.analyticsPeriod === key ? "selected" : ""}>${esc(item.label)}</option>`).join("")}</select></label>`)}
      ${note("Every chart and amount is synthetic and illustrative, not a financial report.")}
      <div class="grid metric-grid">
        ${metric("Sample claims", String(period.claims), esc(period.label), "claims")}
        ${metric("Open examples", String(period.open), "Synthetic status count", "clock")}
        ${metric("Illustrative value", money(period.illustrativeValue), "Not an accounting figure", "analytics")}
        ${metric("Period selected", esc(period.label), "Filter runs locally", "calculation")}
      </div>
      <div class="grid split-grid">
        <section class="panel">${panelHeading("Illustrative claim value", `${esc(period.label)} · synthetic buckets`)}<div class="panel-body"><div class="chart-area" role="list" aria-label="Illustrative synthetic values for ${esc(period.label)}. Bar lengths are proportional to each displayed value.">
          ${period.months.map((item, index) => `<div class="chart-row" role="listitem" aria-label="${esc(item.label)}: ${esc(money(item.value))}" data-testid="chart-bar-${index + 1}"><span class="chart-label">${esc(item.label)}</span><span class="chart-track" aria-hidden="true"><span class="chart-fill" style="width:${max > 0 ? (item.value / max) * 100 : 0}%"></span></span><strong class="chart-value">${money(item.value)}</strong></div>`).join("")}
        </div><p class="panel-subtitle">Bar widths compare synthetic sample figures only.</p></div></section>
        <section class="panel">${panelHeading("Status mix", "Synthetic example counts")}<div class="panel-body">
          ${[
            ["In review", 2, "status-blue"], ["Documents needed", 1, "status-amber"], ["Ready to review", 1, "status-green"],
          ].map(([label, count, tone]) => `<div class="setting-row"><span>${status(label)}</span><strong class="mono">${count} sample${count === 1 ? "" : "s"}</strong></div>`).join("")}
          <div class="session-note">No records leave this page; changing the period only updates the displayed fixture.</div>
        </div></section>
      </div>`;
  }

  function renderTasks() {
    return `${title("WORK MANAGEMENT", "Deadlines & Tasks", "Try a temporary checklist using fictional claim references.", `<button class="button" type="button" data-action="toast" data-message="Creating persistent tasks is disabled in this static demo." data-testid="button-add-task">${icon("tasks")} Add task</button>`)}
      <section class="panel">${panelHeading("Sample task list", "Changes stay in memory until refresh", `<span class="status status-blue">${data.tasks.filter((task) => !state.taskStates[task.id]).length} open examples</span>`)}
        <div class="panel-body"><div class="task-list">${data.tasks.map((task) => `<label class="task-row ${state.taskStates[task.id] ? "done" : ""}" data-testid="task-row-${esc(task.id)}">
          <input class="task-check" type="checkbox" data-task-id="${esc(task.id)}" ${state.taskStates[task.id] ? "checked" : ""} aria-label="Mark sample task ${esc(task.title)} complete" data-testid="checkbox-task-${esc(task.id)}">
          <span class="task-copy"><strong>${esc(task.title)}</strong><small>${esc(task.claimId)} · ${esc(data.claims.find((claim) => claim.id === task.claimId)?.vessel ?? "Sample claim")}</small></span>
          <time class="task-due">${esc(task.due)}</time>${status(task.priority)}
        </label>`).join("")}</div><div class="session-note">These checkboxes do not update a real task or claim.</div></div>
      </section>`;
  }

  function renderSettings() {
    return `${title("PREFERENCES", "Settings", "Local display controls for this synthetic interface.")}
      <div class="grid split-grid"><section class="panel">${panelHeading("Display preferences", "Temporary browser-session controls")}<div class="panel-body">
        <div class="setting-row"><span class="setting-copy"><strong>Show illustrative financial figures</strong><small>Hide or show sample amounts on the current page.</small></span><button class="toggle" type="button" role="switch" aria-checked="${state.showFinancials}" aria-pressed="${state.showFinancials}" data-setting="showFinancials" aria-label="Toggle illustrative financial figures" data-testid="toggle-illustrative-figures"></button></div>
        <div class="setting-row"><span class="setting-copy"><strong>Compact spacing</strong><small>Adjust only the local interface spacing.</small></span><button class="toggle" type="button" role="switch" aria-checked="${state.compactMode}" aria-pressed="${state.compactMode}" data-setting="compactMode" aria-label="Toggle compact spacing" data-testid="toggle-compact-spacing"></button></div>
        <div class="session-note">Preferences are held in memory and reset on refresh. No account, authentication, or connected services are configured.</div>
      </div></section>
      <section class="panel">${panelHeading("Demo boundaries", "Read-only product presentation")}<div class="panel-body">
        <div class="setting-row"><span class="setting-copy"><strong>Data source</strong><small>Fictional fixture bundled with this static site.</small></span><span class="status status-green">Local</span></div>
        <div class="setting-row"><span class="setting-copy"><strong>Business actions</strong><small>Submission, approval, and finalization are unavailable.</small></span><span class="status status-gray">Disabled</span></div>
        <div class="setting-row"><span class="setting-copy"><strong>Saved state</strong><small>Reloading resets all temporary interactions.</small></span><span class="status status-gray">None</span></div>
      </div></section></div>`;
  }

  const pageRenderers = {
    dashboard: renderDashboard,
    claims: renderClaims,
    "command-center": renderCommandCenter,
    documents: renderDocuments,
    extraction: renderExtraction,
    "contract-terms": renderTerms,
    "laytime-calculation": renderCalculation,
    analytics: renderAnalytics,
    "deadlines-tasks": renderTasks,
    settings: renderSettings,
  };

  function currentRoute() {
    const route = window.location.hash.replace(/^#\/?/, "").split(/[?&]/, 1)[0];
    return pageRenderers[route] ? route : "dashboard";
  }

  function syncMobileNavigation() {
    const sidebar = document.getElementById("sidebar");
    const scrim = document.getElementById("mobile-scrim");
    const menu = document.getElementById("menu-button");
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    if (!mobile) state.navOpen = false;
    sidebar.classList.toggle("is-open", mobile && state.navOpen);
    sidebar.inert = mobile && !state.navOpen;
    sidebar.setAttribute("aria-hidden", String(mobile && !state.navOpen));
    scrim.hidden = !(mobile && state.navOpen);
    menu.setAttribute("aria-expanded", String(mobile && state.navOpen));
    document.body.classList.toggle("nav-open", mobile && state.navOpen);
  }

  function applyFilters(scope) {
    const container = document.querySelector(`[data-filter-scope="${scope}"]`);
    if (!container) return;
    const term = container.querySelector(`[data-search="${scope}"]`)?.value.trim().toLowerCase() ?? "";
    const statusValue = container.querySelector(`[data-status-filter="${scope}"]`)?.value ?? "";
    let visible = 0;
    for (const row of container.querySelectorAll(`[data-filter-row="${scope}"]`)) {
      const matches = (!term || row.dataset.searchText.includes(term)) && (!statusValue || row.dataset.status === statusValue);
      row.classList.toggle("is-hidden", !matches);
      if (matches) visible += 1;
    }
    const empty = container.querySelector(`[data-empty-for="${scope}"]`);
    if (empty) empty.style.display = visible ? "none" : "block";
  }

  let toastTimer;
  function toast(message) {
    const region = document.getElementById("toast-region");
    region.innerHTML = `<div class="toast" role="status">${esc(message)}</div>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { region.innerHTML = ""; }, 2600);
  }

  function syncDemoProfile() {
    document.querySelectorAll("[data-demo-profile-name]").forEach((element) => { element.textContent = demoProfileName; });
    document.querySelectorAll("[data-demo-profile-initials]").forEach((element) => { element.textContent = demoProfileInitials; });
    document.querySelector(".topbar-avatar")?.setAttribute("aria-label", `Fictional demo profile: ${demoProfileName} (${demoProfileInitials})`);
    document.querySelector(".profile-menu-button")?.setAttribute("aria-label", `Open fictional demo profile menu for ${demoProfileName}`);
  }

  function populateNotifications() {
    const list = document.getElementById("notification-list");
    if (!list) return;
    list.innerHTML = demoNotifications.length
      ? `<ul>${demoNotifications.map((item) => `<li class="notification-item"><span class="notification-item-mark" aria-hidden="true"></span><span class="notification-item-copy"><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small><time>${esc(item.time)}</time></span></li>`).join("")}</ul><div class="notification-footer"><button class="button button-small" type="button" data-action="dismiss-notifications" data-testid="button-dismiss-notifications">Dismiss sample notifications</button><small>Resets on refresh · no real notifications</small></div>`
      : `<p class="notification-empty" role="status">There are no new synthetic notifications. Refresh to restore the examples.</p>`;
    document.querySelector(".notification-dot").hidden = !demoNotifications.length;
  }

  function setNotificationsOpen(open, restoreFocus = false) {
    state.notificationsOpen = open;
    const trigger = document.getElementById("notification-button");
    const popover = document.getElementById("notification-popover");
    trigger.setAttribute("aria-expanded", String(open));
    popover.hidden = !open;
    if (open) document.querySelector(".popover-close")?.focus();
    else if (restoreFocus) trigger.focus();
  }

  function setProfileMenuOpen(open, restoreFocus = false) {
    state.profileMenuOpen = open;
    const trigger = document.querySelector(".profile-menu-button");
    const popover = document.getElementById("profile-menu");
    trigger.setAttribute("aria-expanded", String(open));
    popover.hidden = !open;
    if (open) popover.querySelector('[role="menuitem"]')?.focus();
    else if (restoreFocus) trigger.focus();
  }

  function positionWorkspaceMenu() {
    if (!state.workspaceMenuOpen) return;
    const trigger = document.getElementById("workspace-switch");
    const menu = document.getElementById("workspace-menu");
    const viewport = window.visualViewport;
    const viewportBottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight);
    const menuTop = trigger.getBoundingClientRect().bottom + 6;
    menu.style.maxHeight = `${Math.max(0, viewportBottom - menuTop - 12)}px`;
  }

  function setWorkspaceMenuOpen(open, restoreFocus = false) {
    state.workspaceMenuOpen = open;
    const trigger = document.getElementById("workspace-switch");
    const menu = document.getElementById("workspace-menu");
    trigger.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    if (open) {
      positionWorkspaceMenu();
      menu.querySelector('[role="menuitem"]')?.focus();
    } else {
      menu.querySelector(".workspace-menu-message").hidden = true;
      menu.querySelector(".workspace-menu-message [role='status']").textContent = "";
      if (restoreFocus) trigger.focus();
    }
  }

  function showWorkspaceMessage(message) {
    const panel = document.getElementById("workspace-menu-message");
    panel.querySelector('[role="status"]').textContent = message;
    panel.hidden = false;
    positionWorkspaceMenu();
  }

  function resetRouteScroll() {
    window.scrollTo(0, 0);
  }

  function render() {
    const route = currentRoute();
    const focusedTestId = page.contains(document.activeElement) ? document.activeElement.dataset.testid : null;
    page.innerHTML = pageRenderers[route]();
    document.getElementById("current-page-label").textContent = pageNames[route];
    document.title = `DEMURVIA — ${pageNames[route]} · UI Demo`;
    for (const link of document.querySelectorAll(".nav-list [data-route]")) {
      if (link.dataset.route === route) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    document.body.classList.toggle("compact-mode", state.compactMode);
    syncMobileNavigation();
    applyFilters("claims");
    applyFilters("documents");
    if (focusedTestId) {
      [...page.querySelectorAll("[data-testid]")].find((element) =>
        element.dataset.testid === focusedTestId && element.getClientRects().length
      )?.focus({ preventScroll: true });
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (state.workspaceMenuOpen && !target.closest(".workspace-menu-wrap")) setWorkspaceMenuOpen(false);
    if (state.notificationsOpen && !target.closest(".notification-wrap")) setNotificationsOpen(false);
    if (state.profileMenuOpen && !target.closest(".profile-menu-wrap")) setProfileMenuOpen(false);
    const routeLink = target.closest("[data-route]");
    if (routeLink) {
      if (routeLink.dataset.selectClaim) state.activeClaimId = routeLink.dataset.selectClaim;
      setNotificationsOpen(false);
      setProfileMenuOpen(false);
      setWorkspaceMenuOpen(false);
      state.navOpen = false;
      syncMobileNavigation();
      resetRouteScroll();
      if (routeLink.getAttribute("href") === window.location.hash) render();
      return;
    }
    const action = target.closest("[data-action]");
    if (action) {
      switch (action.dataset.action) {
        case "toggle-nav":
          state.navOpen = !state.navOpen;
          syncMobileNavigation();
          if (state.navOpen) document.querySelector("#sidebar [data-route]")?.focus();
          break;
        case "toggle-workspace-menu":
          setNotificationsOpen(false);
          setProfileMenuOpen(false);
          setWorkspaceMenuOpen(!state.workspaceMenuOpen);
          break;
        case "workspace-team":
          showWorkspaceMessage("Team membership and permissions are not connected in this static preview.");
          break;
        case "workspace-switch-info":
          showWorkspaceMessage("Only one fictional workspace is available in this static preview.");
          break;
        case "toggle-notifications":
          setWorkspaceMenuOpen(false);
          setProfileMenuOpen(false);
          setNotificationsOpen(!state.notificationsOpen);
          break;
        case "close-notifications":
          setNotificationsOpen(false, true);
          break;
        case "dismiss-notifications":
          demoNotifications.splice(0);
          populateNotifications();
          document.querySelector(".popover-close").focus();
          break;
        case "toggle-profile-menu":
          setWorkspaceMenuOpen(false);
          setNotificationsOpen(false);
          setProfileMenuOpen(!state.profileMenuOpen);
          break;
        case "profile-details":
          setProfileMenuOpen(false, true);
          toast(`${demoProfileName} (${demoProfileInitials}) is a fictional sample operator. No authentication is configured.`);
          break;
        case "close-nav":
          state.navOpen = false;
          syncMobileNavigation();
          document.getElementById("menu-button").focus();
          break;
        case "command-tab":
          state.commandTab = action.dataset.value;
          state.timelineIndex = 0;
          render();
          break;
        case "terms-tab":
          state.termsTab = action.dataset.value;
          render();
          break;
        case "timeline-step": {
          const length = eventsFor(activeClaim().id).length;
          if (length) state.timelineIndex = (state.timelineIndex + Number(action.dataset.direction) + length) % length;
          render();
          break;
        }
        case "review-document": {
          const id = action.dataset.documentId;
          state.documentStates[id] = state.documentStates[id] === "Needs review" ? "Reviewed in demo" : "Needs review";
          render();
          toast("Sample review state changed in this session only.");
          break;
        }
        case "extraction-mark":
          state.extractionStates[activeClaim().id] = "Example marked reviewed in this session";
          render();
          toast("Example state updated locally; no evidence was accepted.");
          break;
        case "extraction-reset":
          delete state.extractionStates[activeClaim().id];
          render();
          toast("Example review state reset.");
          break;
        case "toast":
          toast(action.dataset.message ?? "This action is disabled in the static demo.");
          break;
        default:
          break;
      }
    }
    const setting = target.closest("[data-setting]");
    if (setting) {
      const key = setting.dataset.setting;
      state[key] = !state[key];
      render();
      toast("Display preference changed for this session.");
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;
    if (target.matches("[data-claim-select]")) {
      state.activeClaimId = target.value;
      state.timelineIndex = 0;
      render();
    } else if (target.matches("[data-analytics-period]")) {
      state.analyticsPeriod = target.value;
      render();
    } else if (target.matches("[data-task-id]")) {
      state.taskStates[target.dataset.taskId] = target.checked;
      render();
      toast("Sample task state changed in this session only.");
    } else if (target.matches("[data-status-filter]")) {
      applyFilters(target.dataset.statusFilter);
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target instanceof HTMLInputElement ? event.target : null;
    if (target?.matches("[data-search]")) applyFilters(target.dataset.search);
  });

  document.addEventListener("focusin", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (state.workspaceMenuOpen && !target.closest(".workspace-menu-wrap")) setWorkspaceMenuOpen(false);
    if (state.notificationsOpen && !target.closest(".notification-wrap")) setNotificationsOpen(false);
    if (state.profileMenuOpen && !target.closest(".profile-menu-wrap")) setProfileMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.workspaceMenuOpen) {
        setWorkspaceMenuOpen(false, true);
        return;
      }
      if (state.profileMenuOpen) {
        setProfileMenuOpen(false, true);
        return;
      }
      if (state.notificationsOpen) {
        setNotificationsOpen(false, true);
        return;
      }
      if (state.navOpen) {
        state.navOpen = false;
        syncMobileNavigation();
        document.getElementById("menu-button").focus();
        return;
      }
    }
    if (event.key === "ArrowDown" && document.activeElement === document.getElementById("workspace-switch")) {
      event.preventDefault();
      if (!state.workspaceMenuOpen) {
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
        setWorkspaceMenuOpen(true);
      } else {
        document.querySelector('#workspace-menu [role="menuitem"]')?.focus();
      }
      return;
    }
    if (state.workspaceMenuOpen && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const items = [...document.querySelectorAll('#workspace-menu [role="menuitem"]:not([disabled])')];
      if (items.length) {
        const current = items.indexOf(document.activeElement);
        const next = event.key === "Home" ? 0
          : event.key === "End" ? items.length - 1
            : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        event.preventDefault();
        items[next].focus();
      }
    }
    if (state.profileMenuOpen && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const items = [...document.querySelectorAll('#profile-menu [role="menuitem"]:not([disabled])')];
      if (items.length) {
        event.preventDefault();
        items[0].focus();
      }
    }
    if (event.key === "Tab" && state.navOpen && window.matchMedia("(max-width: 900px)").matches) {
      const sidebar = document.getElementById("sidebar");
      const focusable = [...sidebar.querySelectorAll("a[href], button:not([disabled])")].filter((element) =>
        !element.hidden && element.getClientRects().length
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
  window.addEventListener("hashchange", () => {
    state.navOpen = false;
    resetRouteScroll();
    render();
  });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("resize", syncMobileNavigation, { passive: true });
  window.addEventListener("resize", positionWorkspaceMenu, { passive: true });
  window.addEventListener("scroll", positionWorkspaceMenu, { passive: true });
  document.getElementById("sidebar").addEventListener("scroll", () => setWorkspaceMenuOpen(false), { passive: true });
  window.visualViewport?.addEventListener("resize", positionWorkspaceMenu, { passive: true });
  window.visualViewport?.addEventListener("scroll", positionWorkspaceMenu, { passive: true });
  window.addEventListener("beforeunload", () => clearTimeout(toastTimer), { once: true });

  for (const iconElement of document.querySelectorAll(".nav-icon[data-icon]")) {
    iconElement.innerHTML = icon(iconElement.dataset.icon);
  }

  syncDemoProfile();
  document.getElementById("workspace-switch").setAttribute("aria-label", "Open fictional demo workspace menu for Meridian Claims Desk");
  populateNotifications();
  if (!window.location.hash) window.location.replace("#/dashboard");
  render();
})();
