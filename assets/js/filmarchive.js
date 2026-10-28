// Film Archive: hierarchical document index (group -> manufacturer -> category -> product -> document)
// with an embedded pdf.js reader. Catalog: assets/filmarchive/catalog.json, documents:
// assets/filmarchive/docs/, pdf.js: assets/pdfjs/.
// The reader mirrors the proven pdf.js integration of the FilmArchive desktop app
// (PDFLinkService + custom l10n, text layer and annotations disabled).

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const container = document.getElementById("film-archive");

const els = {
  index: document.getElementById("fa-index"),
  meta: document.getElementById("fa-meta"),
  toolbar: document.getElementById("fa-toolbar"),
  viewer: document.getElementById("fa-viewer"),
  placeholder: document.getElementById("fa-placeholder"),
  loading: document.getElementById("fa-viewer-loading"),
  error: document.getElementById("fa-viewer-error"),
  retry: document.getElementById("fa-retry"),
  prev: document.getElementById("fa-prev"),
  next: document.getElementById("fa-next"),
  page: document.getElementById("fa-page"),
  pageTotal: document.getElementById("fa-page-total"),
  zoomOut: document.getElementById("fa-zoom-out"),
  zoom: document.getElementById("fa-zoom"),
  zoomIn: document.getElementById("fa-zoom-in"),
  fit: document.getElementById("fa-fit"),
  open: document.getElementById("fa-open"),
};

const state = {
  pdfjs: null,
  viewer: null,
  eventBus: null,
  linkService: null,
  loadingTask: null,
  pdf: null,
  seq: 0,
  doc: null,
  selectedBtn: null,
  pendingDoc: null,
  docsBase: "",
  pdfjsBase: "",
};

// Top-level sections of the index. Every category in the catalog carries a
// "group" field ("films" or "papers-chemistry") that selects its section.
const GROUPS = [
  { key: "films", name: "Films" },
  { key: "papers-chemistry", name: "Papers & Chemistry" },
];

// Minimal English l10n shim required by the pdf.js viewer component.
const l10n = {
  getLanguage: () => "en-US",
  get direction() {
    return "ltr";
  },
  async get(key) {
    if (typeof key === "string") return key;
    const entry = key || {};
    if (entry.default != null) return entry.default;
    return entry.message != null ? entry.message : "";
  },
  async translate(element) {
    return element;
  },
  pause() {},
  resume() {},
  async destroy() {},
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

function docUrl(doc) {
  return encodeURI(state.docsBase + doc.path);
}

function showViewerState(which) {
  els.loading.hidden = which !== "loading";
  els.error.hidden = which !== "error";
  els.placeholder.hidden = which !== "placeholder";
}

function renderIndexError(message) {
  els.index.textContent = "";
  els.index.append(el("div", "fa-index-error", message));
}

async function fetchCatalog(catalogUrl) {
  const res = await fetch(catalogUrl);
  if (!res.ok) throw new Error(`catalog request failed with status ${res.status}`);
  return res.json();
}

function docButton(doc) {
  const btn = el("button", "fa-doc", doc.title || doc.path.split("/").pop());
  btn.type = "button";
  btn.title = (doc.title || doc.path) + (doc.type ? " · " + doc.type : "");
  btn.dataset.path = doc.path;
  btn.addEventListener("click", () => selectDocument(doc));
  return btn;
}

function buildIndex(catalog) {
  els.index.textContent = "";
  const frag = document.createDocumentFragment();
  const groupOf = new Map();
  for (const mfr of catalog.manufacturers) {
    for (const cat of mfr.categories || []) {
      groupOf.set(mfr.name + "/" + cat.dir, cat.group === "papers-chemistry" ? "papers-chemistry" : "films");
    }
  }

  let anyGroup = false;
  for (const group of GROUPS) {
    const groupBody = el("div", "fa-body");
    let groupCount = 0;
    let firstMfr = true;

    for (const mfr of catalog.manufacturers) {
      const docsOfMfr = catalog.documents.filter(
        (d) => !d.hidden && d.manufacturer === mfr.name && groupOf.get(mfr.name + "/" + d.categoryDir) === group.key
      );
      if (docsOfMfr.length === 0) continue;
      groupCount += docsOfMfr.length;

      const mfrDetails = el("details", "fa-mfr");
      mfrDetails.open = firstMfr;
      firstMfr = false;
      const mfrSummary = el("summary", "fa-summary");
      mfrSummary.append(el("span", "fa-name", mfr.name), el("span", "fa-count", String(docsOfMfr.length)));
      const mfrBody = el("div", "fa-body");

      for (const cat of mfr.categories || []) {
        const docsOfCat = docsOfMfr.filter((d) => d.categoryDir === cat.dir);
        if (docsOfCat.length === 0) continue;

        const catDetails = el("details", "fa-cat");
        const catSummary = el("summary", "fa-summary");
        catSummary.append(el("span", "fa-name", cat.name), el("span", "fa-count", String(docsOfCat.length)));
        const catBody = el("div", "fa-body");

        const products = [...new Set(docsOfCat.map((d) => d.product))].sort((a, b) => a.localeCompare(b));
        for (const product of products) {
          const docs = docsOfCat.filter((d) => d.product === product);
          if (docs.length === 1) {
            const btn = docButton(docs[0]);
            btn.classList.add("fa-product-doc");
            btn.textContent = product;
            catBody.append(btn);
          } else {
            catBody.append(el("div", "fa-product-name", product));
            const list = el("ul", "fa-docs");
            for (const doc of docs) {
              const item = el("li");
              item.append(docButton(doc));
              list.append(item);
            }
            catBody.append(list);
          }
        }
        catDetails.append(catSummary, catBody);
        mfrBody.append(catDetails);
      }
      mfrDetails.append(mfrSummary, mfrBody);
      groupBody.append(mfrDetails);
    }

    if (groupCount === 0) continue;
    anyGroup = true;
    const groupWrap = el("details", "fa-group");
    groupWrap.open = group.key === "films";
    const groupSummary = el("summary", "fa-summary fa-group-summary");
    groupSummary.append(el("span", "fa-name", group.name), el("span", "fa-count", String(groupCount)));
    groupWrap.append(groupSummary, groupBody);
    frag.append(groupWrap);
  }

  if (!anyGroup) {
    renderIndexError("No documents found in the catalog.");
    return;
  }
  els.index.append(frag);
}

function renderMeta(doc) {
  els.meta.textContent = "";
  const title = doc.title || doc.path.split("/").pop();
  const row = el("div", "fa-meta-row");
  row.append(el("span", "fa-crumb", [doc.manufacturer, doc.category, doc.product].join(" / ")));
  if (doc.type) row.append(el("span", "fa-badge", doc.type));
  if (doc.pages) row.append(el("span", "fa-fact", doc.pages + (doc.pages === 1 ? " page" : " pages")));
  if (doc.sizeBytes) row.append(el("span", "fa-fact", formatBytes(doc.sizeBytes)));
  if (doc.sourceUrl) {
    const link = el("a", "fa-source", "Source ↗");
    link.href = doc.sourceUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.title = "Open the original source of this document";
    row.append(link);
  }
  els.meta.append(el("div", "fa-meta-title", title), row);
  els.meta.hidden = false;
}

async function setupReader() {
  // pdf_viewer.mjs reads globalThis.pdfjsLib at evaluation time, so pdf.mjs must be
  // fully loaded (and executed) before it is imported.
  const pdfjsMod = await import(state.pdfjsBase + "build/pdf.mjs");
  const viewerMod = await import(state.pdfjsBase + "web/pdf_viewer.mjs");
  pdfjsMod.GlobalWorkerOptions.workerSrc = state.pdfjsBase + "build/pdf.worker.mjs";
  state.pdfjs = pdfjsMod;
  state.eventBus = new viewerMod.EventBus();
  state.linkService = new viewerMod.PDFLinkService({ eventBus: state.eventBus, externalLinkTarget: 2 });
  state.viewer = new viewerMod.PDFViewer({
    container: els.viewer,
    viewer: els.viewer.querySelector(".pdfViewer"),
    eventBus: state.eventBus,
    linkService: state.linkService,
    l10n,
    textLayerMode: 0,
    annotationMode: 0,
    removePageBorders: true,
    imageResourcesPath: state.pdfjsBase + "images/",
    maxCanvasPixels: 33554432,
    maxCanvasDim: 32767,
  });
  state.linkService.setViewer(state.viewer);
  state.eventBus.on("pagesinit", () => {
    state.viewer.currentScaleValue = "page-width";
    updateToolbar();
  });
  state.eventBus.on("pagechanging", updateToolbar);
  state.eventBus.on("scalechanging", updateToolbar);
}

function updateToolbar() {
  if (!state.viewer || !state.pdf) return;
  els.page.value = state.viewer.currentPageNumber;
  els.page.max = state.viewer.pagesCount;
  els.pageTotal.textContent = "/ " + state.viewer.pagesCount;
  els.zoom.textContent = Math.round(state.viewer.currentScale * 100) + "%";
}

function wireToolbar() {
  const withViewer = (fn) => () => {
    if (state.viewer && state.pdf) fn();
  };
  els.prev.addEventListener("click", withViewer(() => (state.viewer.currentPageNumber -= 1)));
  els.next.addEventListener("click", withViewer(() => (state.viewer.currentPageNumber += 1)));
  els.page.addEventListener("change", () => {
    if (!state.viewer || !state.pdf) return;
    const value = parseInt(els.page.value, 10);
    if (Number.isFinite(value)) state.viewer.currentPageNumber = value;
    updateToolbar();
  });
  els.zoomOut.addEventListener("click", withViewer(() => (state.viewer.currentScale = Math.max(0.1, state.viewer.currentScale / 1.15))));
  els.zoomIn.addEventListener("click", withViewer(() => (state.viewer.currentScale = Math.min(8, state.viewer.currentScale * 1.15))));
  els.fit.addEventListener("click", withViewer(() => (state.viewer.currentScaleValue = "page-width")));
  els.open.addEventListener("click", () => {
    if (state.doc) window.open(docUrl(state.doc), "_blank", "noopener");
  });
  els.retry.addEventListener("click", () => {
    if (state.doc && state.pdfjs) loadDocument(state.doc);
  });
}

async function loadDocument(doc) {
  if (!state.pdfjs) {
    // The reader modules are still loading; remember the selection and open it
    // as soon as setupReader() finishes instead of failing the click.
    state.pendingDoc = doc;
    showViewerState("loading");
    return;
  }
  state.pendingDoc = null;
  const seq = ++state.seq;
  showViewerState("loading");
  if (state.loadingTask) {
    const stale = state.loadingTask;
    state.loadingTask = null;
    stale.destroy();
  }
  try {
    const task = state.pdfjs.getDocument({
      url: docUrl(doc),
      cMapUrl: state.pdfjsBase + "cmaps/",
      cMapPacked: true,
      standardFontDataUrl: state.pdfjsBase + "standard_fonts/",
      wasmUrl: state.pdfjsBase + "wasm/",
      iccUrl: state.pdfjsBase + "iccs/",
      rangeChunkSize: 1048576,
      disableAutoFetch: false,
      isEvalSupported: false,
    });
    state.loadingTask = task;
    const pdf = await task.promise;
    if (seq !== state.seq) {
      // Superseded while loading; releasing the task tears down its document.
      task.destroy();
      return;
    }
    state.pdf = pdf;
    state.viewer.setDocument(pdf);
    state.linkService.setDocument(pdf, null);
    showViewerState("viewer");
    updateToolbar();
  } catch (err) {
    if (seq !== state.seq) return; // superseded by a newer selection
    showViewerState("error");
    console.error(err);
  }
}

function selectDocument(doc) {
  state.doc = doc;
  const btn = els.index.querySelector(`button.fa-doc[data-path="${CSS.escape(doc.path)}"]`);
  if (state.selectedBtn) state.selectedBtn.classList.remove("fa-doc-active");
  state.selectedBtn = btn;
  if (btn) {
    btn.classList.add("fa-doc-active");
    let parent = btn.closest("details");
    while (parent) {
      parent.open = true;
      parent = parent.parentElement ? parent.parentElement.closest("details") : null;
    }
    btn.scrollIntoView({ block: "nearest" });
  }
  renderMeta(doc);
  els.toolbar.hidden = false;
  loadDocument(doc);
  const url = new URL(window.location);
  url.search = "?doc=" + encodeURIComponent(doc.path);
  window.history.replaceState(null, "", url);
}

async function init() {
  if (!container) return;
  state.docsBase = container.dataset.catalog.replace(/catalog\.json$/, "docs/");
  state.pdfjsBase = container.dataset.pdfjs;

  let catalog;
  try {
    catalog = await fetchCatalog(container.dataset.catalog);
  } catch (err) {
    renderIndexError("Failed to load the film archive catalog.");
    console.error(err);
    return;
  }

  buildIndex(catalog);

  let readerReady = false;
  try {
    await setupReader();
    readerReady = true;
  } catch (err) {
    showViewerState("error");
    console.error(err);
  }

  wireToolbar();

  const pending = state.pendingDoc;
  if (pending) {
    // The user picked a document while the reader was still loading; the
    // selection UI (meta panel, URL, highlight) is already up to date.
    state.pendingDoc = null;
    if (readerReady) loadDocument(pending);
    return;
  }
  if (!readerReady) return;

  const wanted = new URLSearchParams(window.location.search).get("doc");
  const doc = catalog.documents.find((d) => d.path === wanted);
  if (doc) {
    selectDocument(doc);
  } else {
    const firstMfr = container.querySelector(".fa-mfr");
    if (firstMfr) firstMfr.open = true;
  }
}

init();
