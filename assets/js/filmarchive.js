// Film Archive: hierarchical document index (manufacturer -> category -> product -> document)
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
  docsBase: "",
  pdfjsBase: "",
};

// Minimal English l10n shim required by the pdf.js viewer component.
const l10n = {
  getLanguage: () => "en-US",
  get direction() {
    return "ltr";
  },
  async get(key) {
    return typeof key === "string" ? key : key?.default ?? key?.message ?? "";
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

function buildIndex(catalog) {
  els.index.textContent = "";
  const frag = document.createDocumentFragment();
  let firstMfr = true;

  for (const mfr of catalog.manufacturers) {
    const docsOfMfr = catalog.documents.filter((d) => d.manufacturer === mfr.name);
    if (docsOfMfr.length === 0) continue;

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
      const dot = el("span", "fa-dot");
      dot.style.setProperty("--fa-dot", cat.color || "var(--global-theme-color)");
      catSummary.append(dot, el("span", "fa-name", cat.name), el("span", "fa-count", String(docsOfCat.length)));
      const catBody = el("div", "fa-body");

      const products = [...new Set(docsOfCat.map((d) => d.product))].sort((a, b) => a.localeCompare(b));
      for (const product of products) {
        const docs = docsOfCat.filter((d) => d.product === product);
        catBody.append(el("div", "fa-product-name", product));
        const list = el("ul", "fa-docs");
        for (const doc of docs) {
          const item = el("li");
          const btn = el("button", "fa-doc", doc.title || doc.path.split("/").pop());
          btn.type = "button";
          btn.title = (doc.title || doc.path) + (doc.type ? " · " + doc.type : "");
          btn.dataset.path = doc.path;
          btn.addEventListener("click", () => selectDocument(doc));
          item.append(btn);
          list.append(item);
        }
        catBody.append(list);
      }
      catDetails.append(catSummary, catBody);
      mfrBody.append(catDetails);
    }
    mfrDetails.append(mfrSummary, mfrBody);
    frag.append(mfrDetails);
  }

  if (!frag.hasChildNodes()) {
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
}

async function loadDocument(doc) {
  if (!state.pdfjs) {
    showViewerState("error");
    return;
  }
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
      pdf.destroy();
      return;
    }
    if (state.pdf) state.pdf.destroy();
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

  try {
    await setupReader();
  } catch (err) {
    showViewerState("error");
    console.error(err);
  }

  wireToolbar();

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
