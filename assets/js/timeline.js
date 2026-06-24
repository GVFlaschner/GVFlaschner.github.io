const typeLabels = {
  publication: "Publication",
  talk: "Talk",
  media: "Media",
  award: "Award",
  patent: "Patent"
};

const state = {
  filter: "all",
  expertMode: false,
  data: null
};

const timelineList = document.querySelector("#timelineList");
const filterButtons = document.querySelectorAll(".filter-button");
const expertModeToggle = document.querySelector("#expertMode");
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
  const data = await response.json();
  const events = await loadTimelineEvents(data.events || []);
  state.data = {
    ...data,
    events
  };
  renderTimeline();
  bindFilters();
  bindExpertMode();
}

async function loadTimelineEvents(fallbackEvents) {
  try {
    const response = await fetch("assets/data/timeline.csv");
    if (!response.ok) return fallbackEvents;
    const rows = parseCsv(await response.text());
    const events = rows.map(eventFromCsvRow).filter((event) => event.date && event.type && event.title);
    return events.length ? events : fallbackEvents;
  } catch {
    return fallbackEvents;
  }
}

function eventFromCsvRow(row) {
  const links = [1, 2, 3]
    .map((index) => {
      const suffix = index === 1 ? "" : `_${index}`;
      const label = row[`source_label${suffix}`]?.trim();
      const url = row[`source_url${suffix}`]?.trim();
      return label && url ? { label, url } : null;
    })
    .filter(Boolean);

  return {
    date: displayDate(row.date) || "",
    sortDate: normalizeDateKey(row.sort_date) || normalizeDateKey(row.date) || row.sort_date?.trim() || row.date?.trim() || "",
    year: row.year?.trim() || normalizeDateKey(row.sort_date)?.slice(0, 4) || normalizeDateKey(row.date)?.slice(0, 4) || "",
    type: row.type?.trim() || "",
    period: row.period?.trim() || "",
    title: row.title?.trim() || "",
    nonExpertTitle: row.non_expert_title?.trim() || "",
    place: row.place?.trim() || "",
    summary: row.public_text?.trim() || "",
    expertSummary: row.expert_text?.trim() || "",
    links,
    localBackup: row.local_backup?.trim() || ""
  };
}

function normalizeDateKey(value) {
  const text = value?.trim();
  if (!text) return "";

  const excelSerialDate = text.match(/^\d{5}$/);
  if (excelSerialDate) {
    return isoDateFromExcelSerial(Number.parseInt(text, 10));
  }

  const europeanDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (europeanDate) {
    const [, day, month, year] = europeanDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const isoDate = text.match(/^(\d{4})(-\d{2})?(-\d{2})?(-\d+)?$/);
  if (isoDate) return text;

  return "";
}

function displayDate(value) {
  const text = value?.trim();
  if (!text) return "";

  return normalizeDateKey(text) || text;
}

function isoDateFromExcelSerial(serial) {
  const excelEpoch = Date.UTC(1899, 11, 30);
  const date = new Date(excelEpoch + serial * 24 * 60 * 60 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) || [];
  return rows
    .filter((item) => item.some((value) => value.trim()))
    .map((item) => Object.fromEntries(headers.map((header, index) => [header, item[index] || ""])));
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

function bindExpertMode() {
  expertModeToggle?.addEventListener("change", () => {
    state.expertMode = expertModeToggle.checked;
    renderTimeline();
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
    ? `<div class="milestone-strip">${milestones.map((event) => `<span>${escapeHtml(event.title)}</span>`).join("")}</div>`
    : "";

  return `
    <section class="timeline-section-row tone-${group.tone}">
      <div class="timeline-marker">
        <span class="node" aria-hidden="true"></span>
        <div class="half-label">
          <strong>${escapeHtml(group.year)}</strong>
          <span>${escapeHtml(group.halfLabel)}</span>
          <small>${escapeHtml(periodNames)}</small>
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
    ? `<div class="event-links">${event.links.map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`).join("")}</div>`
    : "";
  const summary = summaryForAudience(event);
  const title = titleForAudience(event);

  return `
      <div class="event-card" data-type="${event.type}">
        <button class="event-toggle" type="button" aria-expanded="false">
          <span class="event-meta">
            <span class="event-date">${escapeHtml(event.date)}</span>
            <span class="event-type type-${event.type}">${typeLabels[event.type] || escapeHtml(event.type)}</span>
          </span>
          <span class="event-title">${escapeHtml(title)}</span>
          <span class="event-place">${escapeHtml(event.place)}</span>
        </button>
        <div class="event-details">
          ${summary}
          ${links}
        </div>
      </div>
  `;
}

function summaryForAudience(event) {
  const text = state.expertMode
    ? event.expertSummary || event.summary
    : event.summary;

  return text
    ? `<div class="audience-note"><p>${escapeHtml(text)}</p></div>`
    : "";
}

function titleForAudience(event) {
  return state.expertMode
    ? event.title
    : event.nonExpertTitle || event.title;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
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
