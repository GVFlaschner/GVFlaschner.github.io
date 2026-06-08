const typeLabels = {
  publication: "Publication",
  talk: "Talk",
  media: "Media",
  award: "Award",
  patent: "Patent"
};

const state = {
  filter: "all",
  data: null
};

const timelineList = document.querySelector("#timelineList");
const filterButtons = document.querySelectorAll(".filter-button");
document.querySelector("#year").textContent = new Date().getFullYear();
setupEmailLink();

init();

function setupEmailLink() {
  const link = document.querySelector("#emailLink");
  if (!link) return;

  const domain = link.dataset.domainParts.split(",").join(".");
  const address = `${link.dataset.user}@${domain}`;
  link.href = `mailto:${address}`;
}

async function init() {
  const response = await fetch("assets/data/timeline.json");
  state.data = await response.json();
  renderTimeline();
  bindFilters();
}

function bindFilters() {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      filterButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderTimeline();
    });
  });
}

function renderTimeline() {
  const filtered = state.data.events
    .filter((event) => state.filter === "all" || event.type === state.filter || event.type === "milestone")
    .sort((a, b) => (b.sortDate || b.date).localeCompare(a.sortDate || a.date));

  timelineList.innerHTML = halfYearGroups(filtered)
    .map((group) => groupTemplate(group))
    .join("");

  document.querySelectorAll(".event-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".event-card");
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      card.classList.toggle("open", !expanded);
    });
  });
}

function halfYearGroups(events) {
  const groups = new Map();
  events.forEach((event) => {
    const half = halfYearForEvent(event);
    if (!groups.has(half.key)) {
      groups.set(half.key, {
        ...half,
        events: []
      });
    }
    groups.get(half.key).events.push(event);
  });

  return Array.from(groups.values())
    .map((group) => {
      const periods = uniquePeriods(group.events);
      const primaryPeriod = periods[0];
      return {
        ...group,
        periods,
        tone: primaryPeriod?.tone || "neutral",
        events: group.events.sort((a, b) => (b.sortDate || b.date).localeCompare(a.sortDate || a.date))
      };
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}

function groupTemplate(group) {
  const milestones = group.events.filter((event) => event.type === "milestone");
  const publicEvents = group.events.filter((event) => event.type !== "milestone");
  const periodNames = group.periods.map((period) => period.label).join(" / ");
  const milestoneChips = milestones.length
    ? `<div class="milestone-strip">${milestones.map((event) => `<span>${event.title}</span>`).join("")}</div>`
    : "";

  return `
    <section class="timeline-section-row tone-${group.tone}">
      <div class="timeline-marker">
        <span class="node" aria-hidden="true"></span>
        <div class="half-label">
          <strong>${group.year}</strong>
          <span>${group.halfLabel}</span>
          <small>${periodNames}</small>
        </div>
      </div>
      <div class="half-content">
        ${milestoneChips}
        <div class="event-cluster">
          ${publicEvents.map((event) => eventCardTemplate(event)).join("")}
        </div>
      </div>
    </section>
  `;
}

function eventCardTemplate(event) {
  const links = event.links?.length
    ? `<div class="event-links">${event.links.map((link) => `<a href="${link.url}" target="_blank" rel="noopener">${link.label}</a>`).join("")}</div>`
    : "";

  return `
      <div class="event-card" data-type="${event.type}">
        <button class="event-toggle" type="button" aria-expanded="false">
          <span class="event-meta">
            <span class="event-date">${event.date}</span>
            <span class="event-type type-${event.type}">${typeLabels[event.type] || event.type}</span>
          </span>
          <span class="event-title">${event.title}</span>
          <span class="event-place">${event.place}</span>
        </button>
        <div class="event-details">
          <p>${event.summary}</p>
          ${links}
        </div>
      </div>
  `;
}

function halfYearForEvent(event) {
  const sortDate = event.sortDate || event.date || event.year;
  const year = Number.parseInt(sortDate, 10);
  const monthMatch = String(sortDate).match(/^\d{4}-(\d{2})/);
  const month = monthMatch ? Number.parseInt(monthMatch[1], 10) : 1;
  const half = month > 6 ? 2 : 1;

  return {
    key: `${year}-${half}`,
    year,
    half,
    halfLabel: half === 1 ? "Jan-Jun" : "Jul-Dec"
  };
}

function uniquePeriods(events) {
  const periods = [];
  events.forEach((event) => {
    const period = periodForEvent(event);
    if (period && !periods.some((item) => item.label === period.label)) {
      periods.push(period);
    }
  });
  return periods;
}

function periodForEvent(event) {
  if (event.period) {
    return state.data.periods.find((period) => period.label === event.period);
  }
  const year = Number.parseInt(event.year, 10);
  return state.data.periods.find((period) => {
    const start = Number.parseInt(period.start, 10);
    const end = period.end === "now" ? 9999 : Number.parseInt(period.end, 10);
    return year >= start && year <= end;
  });
}
