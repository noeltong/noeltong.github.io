// FilmArchive PDF viewer — 本地离线 PDF.js 查看器
// 与 WPF 宿主通过 postMessage 通信；不依赖任何网络资源。

import "./build/pdf.mjs";

const pdfjsLib = globalThis.pdfjsLib;
if (!pdfjsLib) {
  throw new Error("PDF.js 核心库未能初始化");
}

const assetUrl = (path) => new URL(path, import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = assetUrl("./build/pdf.worker.mjs");

const { EventBus, PDFLinkService, PDFViewer } = await import("./web/pdf_viewer.mjs");

const DOC_ORIGIN = "https://filmarchive-docs.example";

const els = {
  container: document.getElementById("viewerContainer"),
  viewer: document.getElementById("viewer"),
  overlay: document.getElementById("overlay"),
  icon: document.getElementById("overlayIcon"),
  title: document.getElementById("overlayTitle"),
  detail: document.getElementById("overlayDetail"),
  progressWrap: document.getElementById("progressWrap"),
  progressBar: document.getElementById("progressBar"),
  retry: document.getElementById("retryButton"),
};

const l10n = {
  getLanguage: () => "zh-CN",
  get direction() {
    return "ltr";
  },
  async get(key) {
    if (typeof key === "string") {
      return key;
    }
    return key?.default ?? key?.message ?? "";
  },
  async translate(element) {
    return element;
  },
  pause() {},
  resume() {},
  async destroy() {},
};

const eventBus = new EventBus();
const linkService = new PDFLinkService({ eventBus, externalLinkTarget: 2 });

const pdfViewer = new PDFViewer({
  container: els.container,
  viewer: els.viewer,
  eventBus,
  linkService,
  l10n,
  textLayerMode: 0,
  annotationMode: 0,
  removePageBorders: true,
  imageResourcesPath: assetUrl("./images/"),
  maxCanvasPixels: 33554432,
  maxCanvasDim: 32767,
});

linkService.setViewer(pdfViewer);

let currentRequestId = null;
let loadingTask = null;
let currentDoc = null;
let lastUrl = null;
let lastTitle = "";
let scaleMode = "page-width";
let firstRenderReported = false;
let stateQueued = false;

function post(payload) {
  try {
    window.chrome?.webview?.postMessage(payload);
  } catch (err) {
    console.error("postMessage failed", err);
  }
}

function setOverlay({ icon = "◫", title, detail = "", mode = "info", progress = null, retry = false }) {
  els.overlay.classList.remove("hidden");
  els.icon.textContent = icon;
  els.title.textContent = title ?? "";
  els.detail.textContent = detail;
  els.retry.classList.toggle("hidden", !retry);

  if (progress === null) {
    els.progressWrap.classList.add("hidden");
  } else {
    els.progressWrap.classList.remove("hidden");
    els.progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }

  if (mode === "error") {
    els.icon.style.color = "#e06c5a";
  } else {
    els.icon.style.color = "";
  }
}

function hideOverlay() {
  els.overlay.classList.add("hidden");
}

function postState(force = false) {
  if (!currentDoc) {
    return;
  }
  if (stateQueued && !force) {
    return;
  }
  stateQueued = true;
  requestAnimationFrame(() => {
    stateQueued = false;
    if (!currentDoc) {
      return;
    }
    post({
      type: "state",
      requestId: currentRequestId,
      page: pdfViewer.currentPageNumber,
      pageCount: currentDoc.numPages,
      scale: Number(pdfViewer.currentScale?.toFixed(4)) || 1,
      scaleMode: typeof pdfViewer.currentScaleValue === "string" ? pdfViewer.currentScaleValue : "",
      rotation: pdfViewer.pagesRotation,
    });
  });
}

async function destroyCurrent() {
  const task = loadingTask;
  loadingTask = null;
  currentDoc = null;
  try {
    pdfViewer.setDocument(null);
    linkService.setDocument(null, null);
  } catch (err) {
    console.warn("reset viewer failed", err);
  }
  if (task) {
    try {
      await task.destroy();
    } catch (err) {
      console.warn("destroy loading task failed", err);
    }
  }
}

async function openDocument(url, title, requestId) {
  if (typeof url !== "string" || !url.startsWith(`${DOC_ORIGIN}/`)) {
    post({ type: "loadError", requestId, name: "SecurityError", message: "非法的文档地址" });
    setOverlay({ icon: "⚠", title: "无法打开该文档", detail: "地址不在允许的范围内。", mode: "error" });
    return;
  }

  await destroyCurrent();

  currentRequestId = requestId;
  lastUrl = url;
  lastTitle = title || "PDF 文档";
  firstRenderReported = false;

  setOverlay({
    icon: "◫",
    title: lastTitle,
    detail: "正在载入文档…",
    progress: 0,
  });

  const task = pdfjsLib.getDocument({
    url,
    cMapUrl: assetUrl("./cmaps/"),
    cMapPacked: true,
    standardFontDataUrl: assetUrl("./standard_fonts/"),
    wasmUrl: assetUrl("./wasm/"),
    iccUrl: assetUrl("./iccs/"),
    rangeChunkSize: 1048576,
    disableAutoFetch: false,
    isEvalSupported: false,
  });
  loadingTask = task;

  task.onProgress = ({ loaded, total }) => {
    if (requestId !== currentRequestId) {
      return;
    }
    const pct = total > 0 ? (loaded / total) * 100 : null;
    post({ type: "progress", requestId, loaded, total });
    if (pct !== null) {
      els.detail.textContent = `正在载入文档… ${Math.round(pct)}%`;
      els.progressBar.style.width = `${pct}%`;
    }
  };

  try {
    const doc = await task.promise;
    if (requestId !== currentRequestId) {
      await task.destroy().catch(() => {});
      return;
    }

    currentDoc = doc;

    const onPagesInit = () => {
      eventBus.off("pagesinit", onPagesInit);
      pdfViewer.currentScaleValue = scaleMode || "page-width";
      hideOverlay();
      postState(true);
    };
    eventBus.on("pagesinit", onPagesInit);

    pdfViewer.setDocument(doc);
    linkService.setDocument(doc, null);

    post({ type: "documentLoaded", requestId, pageCount: doc.numPages, title: lastTitle });
    postState(true);
    els.container.focus();
  } catch (err) {
    if (requestId !== currentRequestId) {
      return;
    }
    const name = err?.name || "Error";
    const message = err?.message || String(err);
    post({ type: "loadError", requestId, name, message });
    setOverlay({
      icon: "⚠",
      title: "文档加载失败",
      detail: `无法解析该 PDF：${message}`,
      mode: "error",
      retry: true,
    });
  }
}

function clampScale(value) {
  return Math.min(8, Math.max(0.1, value));
}

function executeCommand(name, payload) {
  if (!currentDoc) {
    return;
  }
  const pageCount = currentDoc.numPages;

  switch (name) {
    case "nextPage":
      pdfViewer.currentPageNumber = Math.min(pageCount, pdfViewer.currentPageNumber + 1);
      break;
    case "previousPage":
      pdfViewer.currentPageNumber = Math.max(1, pdfViewer.currentPageNumber - 1);
      break;
    case "firstPage":
      pdfViewer.currentPageNumber = 1;
      break;
    case "lastPage":
      pdfViewer.currentPageNumber = pageCount;
      break;
    case "goToPage": {
      const page = Number(payload?.page);
      if (Number.isFinite(page)) {
        pdfViewer.currentPageNumber = Math.min(pageCount, Math.max(1, Math.round(page)));
      }
      break;
    }
    case "zoomIn":
      pdfViewer.currentScale = clampScale(pdfViewer.currentScale * 1.15);
      scaleMode = "";
      break;
    case "zoomOut":
      pdfViewer.currentScale = clampScale(pdfViewer.currentScale / 1.15);
      scaleMode = "";
      break;
    case "fitWidth":
      scaleMode = "page-width";
      pdfViewer.currentScaleValue = "page-width";
      break;
    case "fitPage":
      scaleMode = "page-fit";
      pdfViewer.currentScaleValue = "page-fit";
      break;
    case "actualSize":
      scaleMode = "page-actual";
      pdfViewer.currentScaleValue = "page-actual";
      break;
    case "rotateClockwise":
      pdfViewer.pagesRotation = (pdfViewer.pagesRotation + 90) % 360;
      break;
    case "rotateCounterClockwise":
      pdfViewer.pagesRotation = (pdfViewer.pagesRotation + 270) % 360;
      break;
    case "retry":
      if (lastUrl) {
        openDocument(lastUrl, lastTitle, currentRequestId || "retry");
      }
      break;
    default:
      break;
  }
  postState(true);
}

eventBus.on("pagechanging", () => postState());
eventBus.on("scalechanging", () => postState());
eventBus.on("rotationchanging", () => postState());

eventBus.on("pagerendered", (event) => {
  if (!firstRenderReported && currentDoc) {
    firstRenderReported = true;
    post({
      type: "firstPageRendered",
      requestId: currentRequestId,
      pageNumber: event.pageNumber,
      pageCount: currentDoc.numPages,
    });
  }
});

els.retry.addEventListener("click", () => executeCommand("retry"));

window.chrome?.webview?.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") {
    return;
  }
  switch (msg.type) {
    case "openDocument":
      openDocument(msg.url, msg.title, msg.requestId);
      break;
    case "command":
      executeCommand(msg.name, msg);
      break;
    case "showError":
      setOverlay({
        icon: "⚠",
        title: msg.title || "无法打开文档",
        detail: msg.detail || "",
        mode: "error",
        retry: Boolean(msg.retry),
      });
      break;
    default:
      break;
  }
});

document.addEventListener("keydown", (event) => {
  const ctrl = event.ctrlKey || event.metaKey;
  if (ctrl && event.key.toLowerCase() === "f") {
    event.preventDefault();
    post({ type: "requestFocusSearch" });
    return;
  }
  if (ctrl && (event.key === "+" || event.key === "=")) {
    event.preventDefault();
    executeCommand("zoomIn");
    return;
  }
  if (ctrl && event.key === "-") {
    event.preventDefault();
    executeCommand("zoomOut");
    return;
  }
  if (ctrl && event.key === "0") {
    event.preventDefault();
    executeCommand("fitPage");
    return;
  }
  if (ctrl && event.key === "1") {
    event.preventDefault();
    executeCommand("actualSize");
    return;
  }
  if (ctrl && event.key === "2") {
    event.preventDefault();
    executeCommand("fitWidth");
    return;
  }
  if (ctrl) {
    return;
  }

  switch (event.key) {
    case "PageDown":
      event.preventDefault();
      executeCommand("nextPage");
      break;
    case "PageUp":
      event.preventDefault();
      executeCommand("previousPage");
      break;
    case "Home":
      event.preventDefault();
      executeCommand("firstPage");
      break;
    case "End":
      event.preventDefault();
      executeCommand("lastPage");
      break;
    case "r":
      event.preventDefault();
      executeCommand("rotateClockwise");
      break;
    case "R":
      event.preventDefault();
      executeCommand("rotateCounterClockwise");
      break;
    default:
      break;
  }
});

els.container.tabIndex = 0;
setOverlay({
  icon: "◫",
  title: "请选择一份文档",
  detail: "从左侧索引中选择胶卷或文档开始浏览。",
});
post({ type: "ready", pdfjsVersion: pdfjsLib.version });
