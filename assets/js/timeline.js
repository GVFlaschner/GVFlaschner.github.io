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

init();

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

  let lastPeriod = "";
  timelineList.innerHTML = filtered.map((event, index) => {
    const period = periodForEvent(event);
    const showPeriod = period?.label !== lastPeriod;
    lastPeriod = period?.label || lastPeriod;
    return eventTemplate(event, index, period, showPeriod);
  }).join("");

  document.querySelectorAll(".event-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".event-card");
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      card.classList.toggle("open", !expanded);
    });
  });
}

function eventTemplate(event, index, period, showPeriod) {
  const side = event.side || (index % 2 === 0 ? "left" : "right");
  const tone = period?.tone || "neutral";
  const periodLabel = showPeriod && period ? `
    <div class="period-break tone-${tone}">
      <div class="period-label">
        <strong>${period.label}</strong>
        <span>${period.start}-${period.end}</span>
        <small>${period.subtitle}</small>
      </div>
    </div>
  ` : "";
  const links = event.links?.length
    ? `<div class="event-links">${event.links.map((link) => `<a href="${link.url}" target="_blank" rel="noopener">${link.label}</a>`).join("")}</div>`
    : "";

  if (event.type === "milestone") {
    return `
      ${periodLabel}
      <article class="timeline-row milestone-row row-${side} tone-${tone}" data-type="${event.type}">
        <div class="milestone-label">
          <strong>${event.title}</strong>
        </div>
        <div class="center-lane">
          <span class="node" aria-hidden="true"></span>
        </div>
      </article>
    `;
  }

  return `
    ${periodLabel}
    <article class="timeline-row row-${side} tone-${tone}" data-type="${event.type}">
      <div class="event-card">
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
      <div class="center-lane">
        <span class="node" aria-hidden="true"></span>
      </div>
    </article>
  `;
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
