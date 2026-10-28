// Reciprocity calculator: pick a film stock, enter the metered exposure, get the
// manufacturer-published correction. Data lives in reciprocity-data.js.

import { FILM_STOCKS } from "./reciprocity-data.js";

const root = document.getElementById("reciprocity-calculator");

const els = {
  film: document.getElementById("rc-film"),
  time: document.getElementById("rc-time"),
  unit: document.getElementById("rc-unit"),
  round: document.getElementById("rc-push"),
  noData: document.getElementById("rc-no-data"),
  result: document.getElementById("rc-result"),
  source: document.getElementById("rc-source"),
  table: document.getElementById("rc-table").querySelector("tbody"),
};

const state = { stock: null, seconds: 10 };

// ---------------------------------------------------------------- formatting helpers

function formatSeconds(value) {
  if (!Number.isFinite(value)) return "—";
  if (value < 1) {
    const denom = Math.round(1 / value);
    return `1/${denom} s`;
  }
  if (value < 60) {
    return `${value < 10 ? value.toFixed(1).replace(/\.0$/, "") : Math.round(value)} s`;
  }
  if (value < 3600) {
    const min = value / 60;
    return `${min < 10 ? min.toFixed(1).replace(/\.0$/, "") : Math.round(min)} min`;
  }
  const hours = value / 3600;
  return `${hours < 10 ? hours.toFixed(1).replace(/\.0$/, "") : Math.round(hours)} h`;
}

function formatStops(stops) {
  if (!Number.isFinite(stops)) return "—";
  if (Math.abs(stops) < 0.02) return "none";
  const fractions = [
    [0.333, "1/3"],
    [0.5, "1/2"],
    [0.667, "2/3"],
    [1, "1"],
    [1.5, "1 1/2"],
    [2, "2"],
    [2.5, "2 1/2"],
    [3, "3"],
    [4, "4"],
  ];
  for (const [value, label] of fractions) {
    if (Math.abs(Math.abs(stops) - value) < 0.04) {
      return `${stops > 0 ? "+" : "−"}${label} stop${value === 1 ? "" : "s"}`;
    }
  }
  return `${stops > 0 ? "+" : "−"}${Math.abs(stops).toFixed(1)} stops`;
}

// ---------------------------------------------------------------- correction models

// Piecewise-linear interpolation in log-time between published points, holding the
// first/last value outside the published range.
function tableStops(points, seconds) {
  const sorted = [...points].sort((a, b) => a.seconds - b.seconds);
  if (seconds <= sorted[0].seconds) return sorted[0].stops;
  const last = sorted[sorted.length - 1];
  if (seconds >= last.seconds) return last.stops;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (seconds >= a.seconds && seconds <= b.seconds) {
      const t = (Math.log(seconds) - Math.log(a.seconds)) / (Math.log(b.seconds) - Math.log(a.seconds));
      return a.stops + t * (b.stops - a.stops);
    }
  }
  return last.stops;
}

// Adox publishes corrected times directly; interpolate between them in log-log space.
function secondsModel(points, seconds) {
  const sorted = [...points].sort((a, b) => a.seconds - b.seconds);
  if (seconds <= sorted[0].seconds) return sorted[0].corrected;
  const last = sorted[sorted.length - 1];
  if (seconds >= last.seconds) {
    // Extrapolate with the slope of the final published segment.
    const a = sorted[sorted.length - 2];
    const b = last;
    const slope = (Math.log(b.corrected) - Math.log(a.corrected)) / (Math.log(b.seconds) - Math.log(a.seconds));
    return Math.exp(Math.log(b.corrected) + slope * (Math.log(seconds) - Math.log(b.seconds)));
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (seconds >= a.seconds && seconds <= b.seconds) {
      const t = (Math.log(seconds) - Math.log(a.seconds)) / (Math.log(b.seconds) - Math.log(a.seconds));
      return Math.exp(Math.log(a.corrected) + t * (Math.log(b.corrected) - Math.log(a.corrected)));
    }
  }
  return last.corrected;
}

// Returns the corrected exposure time in seconds, or null when no correction can
// be computed (no model, or beyond the officially stated range of a "none" model).
function correct(stock, seconds) {
  const model = stock.model;
  if (!model) return null;
  if (model.type === "power") {
    if (seconds <= 1) return seconds;
    return Math.pow(seconds, model.factor);
  }
  if (model.type === "table") {
    if (stock.maxSeconds && seconds <= 1) return seconds;
    const stops = tableStops(model.points, seconds);
    return seconds * Math.pow(2, stops);
  }
  if (model.type === "seconds") {
    if (seconds <= 1) return seconds;
    return secondsModel(model.points, seconds);
  }
  if (model.type === "none") {
    if (seconds <= model.upToSeconds) return seconds;
    return null;
  }
  return null;
}

function tableRows(stock) {
  const model = stock.model;
  if (!model) return [];
  if (model.type === "power") {
    return [1, 2, 5, 10, 30, 60, 120, 300].map((seconds) => {
      const corrected = Math.pow(seconds, model.factor);
      return { seconds, stops: Math.log2(corrected / seconds), corrected };
    });
  }
  if (model.type === "table") {
    const sorted = [...model.points].sort((a, b) => a.seconds - b.seconds);
    const rows = sorted.map((p) => ({ seconds: p.seconds, stops: p.stops, corrected: p.seconds * Math.pow(2, p.stops) }));
    const last = rows[rows.length - 1];
    if (!stock.maxSeconds && last.seconds < 600) {
      const doubled = last.seconds * 2;
      rows.push({ seconds: doubled, stops: last.stops, corrected: doubled * Math.pow(2, last.stops) });
    }
    return rows;
  }
  if (model.type === "seconds") {
    return [...model.points]
      .sort((a, b) => a.seconds - b.seconds)
      .map((p) => ({ seconds: p.seconds, stops: Math.log2(p.corrected / p.seconds), corrected: p.corrected }));
  }
  return [];
}

// ---------------------------------------------------------------- rendering

function renderOptions() {
  const makers = [...new Set(FILM_STOCKS.map((s) => s.maker))];
  const frag = document.createDocumentFragment();
  for (const maker of makers) {
    const group = document.createElement("optgroup");
    group.label = maker;
    for (const stock of FILM_STOCKS.filter((s) => s.maker === maker)) {
      const option = document.createElement("option");
      option.value = stock.id;
      let suffix = "";
      if (!stock.model) suffix = " — no official data";
      else if (stock.model.type === "none") suffix = ` — none needed ≤ ${formatSeconds(stock.model.upToSeconds)}`;
      else if (stock.official === false) suffix = " — community reference";
      option.textContent = `${stock.name} · ISO ${stock.iso} · ${stock.category}${suffix}`;
      group.append(option);
    }
    frag.append(group);
  }
  els.film.append(frag);
  els.film.value = "kodak-tri-x-400";
}

function renderSource(stock) {
  els.source.textContent = "";
  const label = document.createElement("span");
  label.textContent = "Source: ";
  const link = document.createElement("a");
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = stock.source.label;
  const reader = document.createElement("a");
  if (stock.source.pdf) {
    link.href =
      "/assets/filmarchive/docs/" +
      stock.source.pdf.split("/").map(encodeURIComponent).join("/");
    reader.href = "/filmarchive/?doc=" + encodeURIComponent(stock.source.pdf);
    reader.textContent = " (open in reader)";
  } else {
    link.href = stock.source.url;
  }
  els.source.append(label, link, reader);
}

function renderTable(stock) {
  els.table.textContent = "";
  if (stock.model && stock.model.type === "none") {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = `Official statement: no correction or filter compensation needed up to ${formatSeconds(stock.model.upToSeconds)}. Nothing is published beyond that.`;
    tr.append(td);
    els.table.append(tr);
    return;
  }
  const rows = tableRows(stock);
  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "The manufacturer publishes no correction curve for this film.";
    tr.append(td);
    els.table.append(tr);
    return;
  }
  for (const row of rows) {
    const tr = document.createElement("tr");
    const cells = [
      `${formatSeconds(row.seconds)} metered`,
      formatStops(row.stops),
      formatSeconds(row.corrected),
    ];
    cells.forEach((text, index) => {
      const td = document.createElement("td");
      td.textContent = text;
      if (index > 0) td.className = "rc-num";
      tr.append(td);
    });
    els.table.append(tr);
  }
}

function renderWarning(stock) {
  const model = stock.model;
  if (model && model.type === "none" && state.seconds > model.upToSeconds) {
    els.noData.hidden = false;
    els.noData.textContent =
      `The official data for ${stock.maker} ${stock.name} covers only up to ${formatSeconds(model.upToSeconds)}. ` +
      (stock.note || "Nothing is published beyond that range — test before relying on a result.");
    return;
  }
  if (stock.official === false && model) {
    els.noData.hidden = false;
    els.noData.textContent =
      `Community reference values for ${stock.maker} ${stock.name} — not manufacturer-published data. ` +
      (stock.note || "Verify by testing before critical use.");
    return;
  }
  if (!model) {
    els.noData.hidden = false;
    els.noData.textContent = `No official reciprocity data for ${stock.maker} ${stock.name}. ${stock.note}`;
    return;
  }
  els.noData.hidden = true;
  els.noData.textContent = "";
}

function renderResult(stock, seconds) {
  els.result.textContent = "";
  const corrected = correct(stock, seconds);
  if (corrected === null) {
    els.result.hidden = true;
    return;
  }
  els.result.hidden = false;

  let displayCorrected = corrected;
  if (els.round.checked) displayCorrected = roundToThirdStop(corrected);
  const stops = Math.log2(corrected / seconds);

  const main = document.createElement("div");
  main.className = "rc-result-main";

  const bigWrap = document.createElement("div");
  const bigLabel = document.createElement("span");
  bigLabel.className = "rc-big-label";
  bigLabel.textContent = "Corrected exposure";
  const big = document.createElement("span");
  big.className = "rc-big";
  big.textContent = formatSeconds(displayCorrected);
  bigWrap.append(bigLabel, big);

  const altWrap = document.createElement("div");
  const altLabel = document.createElement("span");
  altLabel.className = "rc-big-label";
  altLabel.textContent = "Metered";
  const alt = document.createElement("span");
  alt.className = "rc-big";
  alt.style.color = "var(--global-text-color)";
  alt.style.fontSize = "1.3rem";
  alt.textContent = formatSeconds(seconds);
  altWrap.append(altLabel, alt);

  main.append(bigWrap, altWrap);
  els.result.append(main);

  const figures = document.createElement("div");
  figures.className = "rc-figures";
  const items = [
    ["Correction", formatStops(stops)],
    ["Multiplier", `${(corrected / seconds).toFixed(2)}×`],
    ["Exact value", `${corrected < 60 ? corrected.toFixed(1) : Math.round(corrected)} s`],
  ];
  for (const [label, value] of items) {
    const fig = document.createElement("div");
    fig.className = "rc-figure";
    const lbl = document.createElement("span");
    lbl.textContent = label + ": ";
    fig.append(lbl, document.createTextNode(value));
    figures.append(fig);
  }
  els.result.append(figures);

  const notes = [];
  if (stock.official === false) {
    notes.push("These are community reference values, not manufacturer-published corrections.");
  }
  if (stock.model.type === "none") {
    notes.push(`Per the manufacturer, exposures up to ${formatSeconds(stock.model.upToSeconds)} need no compensation.`);
  }
  if (stock.model.type === "power" && seconds <= 1) {
    notes.push("Ilford states that exposures of 1 second or less need no compensation.");
  }
  if (stock.maxSeconds && seconds > stock.maxSeconds) {
    notes.push(
      `The manufacturer does not recommend exposures beyond ${formatSeconds(stock.maxSeconds)} for this film; the value shown extrapolates their published curve.`
    );
  }
  if (!stock.model) notes.push(stock.note);
  else if (stock.note) notes.push(stock.note);
  if (els.round.checked) {
    notes.push("Rounded to the nearest 1/3 stop, matching typical aperture or shutter scales.");
  }
  if (notes.length) {
    const note = document.createElement("div");
    note.className = "rc-note";
    note.textContent = notes.join(" ");
    els.result.append(note);
  }
}

// Round to the closest 1/3 stop, the smallest increment on most cameras.
function roundToThirdStop(seconds) {
  const third = Math.pow(2, 1 / 3);
  return Math.pow(third, Math.round(Math.log(seconds) / Math.log(third)));
}

function update() {
  const stock = FILM_STOCKS.find((s) => s.id === els.film.value);
  if (!stock) return;
  state.stock = stock;
  const value = parseFloat(els.time.value);
  state.seconds = Number.isFinite(value) && value > 0 ? value * parseFloat(els.unit.value) : 0;

  renderWarning(stock);
  renderSource(stock);
  renderTable(stock);
  if (state.seconds > 0) renderResult(stock, state.seconds);
  else els.result.hidden = true;
}

function init() {
  if (!root) return;
  renderOptions();
  els.film.addEventListener("change", update);
  els.time.addEventListener("input", update);
  els.unit.addEventListener("change", update);
  els.round.addEventListener("change", update);

  const params = new URLSearchParams(window.location.search);
  const wanted = params.get("film");
  if (wanted && FILM_STOCKS.some((s) => s.id === wanted)) els.film.value = wanted;
  const seconds = parseFloat(params.get("seconds"));
  if (Number.isFinite(seconds) && seconds > 0) {
    els.unit.value = "1";
    els.time.value = String(seconds);
  }

  update();
}

init();
