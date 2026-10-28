---
layout: page
title: Film Archive
permalink: /filmarchive/
description: >-
  Official documentation for photographic films and darkroom chemistry, indexed by
  manufacturer, film type, and product, with a built-in PDF reader.
_styles: |
  .fa-layout {
    display: flex;
    gap: 1.25rem;
    align-items: stretch;
  }
  .fa-index {
    flex: 0 0 300px;
    align-self: flex-start;
    max-height: 78vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--global-divider-color);
    border-radius: 0.5rem;
    background: var(--global-card-bg-color);
    padding: 0.5rem;
  }
  .fa-index-error {
    padding: 0.75rem;
    font-size: 0.9rem;
    color: var(--global-text-color);
  }
  .fa-summary {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.5rem;
    border-radius: 0.35rem;
    cursor: pointer;
    font-weight: 500;
    color: var(--global-text-color);
    list-style: none;
  }
  .fa-summary::-webkit-details-marker {
    display: none;
  }
  .fa-summary:hover {
    background: var(--global-hover-color);
  }
  .fa-summary .fa-name {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fa-count {
    flex: none;
    font-size: 0.72rem;
    color: var(--global-text-color-light);
    background: var(--global-code-bg-color);
    border-radius: 999px;
    padding: 0.05rem 0.5rem;
  }
  .fa-cat .fa-summary {
    font-weight: 400;
    font-size: 0.92rem;
  }
  .fa-group-summary {
    font-weight: 600;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--global-text-color-light);
  }
  .fa-group > .fa-body {
    padding: 0.15rem 0.1rem 0.4rem;
  }
  .fa-body {
    padding: 0 0.25rem 0.4rem 1rem;
  }
  .fa-product-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--global-text-color-light);
    margin: 0.5rem 0 0.15rem;
  }
  .fa-product-doc {
    margin-top: 0.35rem;
    font-weight: 600;
    font-size: 0.92rem;
  }
  .fa-docs {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .fa-doc {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: 0;
    border-radius: 0.35rem;
    padding: 0.3rem 0.5rem;
    font-size: 0.88rem;
    color: var(--global-text-color);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fa-doc:hover {
    background: var(--global-hover-color);
    color: var(--global-hover-text-color);
  }
  .fa-doc-active,
  .fa-doc-active:hover {
    background: var(--global-theme-color);
    color: var(--global-bg-color);
  }
  .fa-reader {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .fa-meta {
    border: 1px solid var(--global-divider-color);
    border-radius: 0.5rem 0.5rem 0 0;
    background: var(--global-card-bg-color);
    padding: 0.6rem 0.9rem;
  }
  .fa-meta-title {
    font-weight: 600;
    font-size: 0.98rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fa-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.9rem;
    margin-top: 0.25rem;
    font-size: 0.83rem;
    color: var(--global-text-color-light);
  }
  .fa-badge {
    display: inline-block;
    padding: 0.05rem 0.5rem;
    border-radius: 999px;
    background: var(--global-code-bg-color);
    color: var(--global-text-color);
    font-size: 0.75rem;
  }
  .fa-source {
    color: var(--global-theme-color);
    text-decoration: none;
  }
  .fa-source:hover {
    text-decoration: underline;
  }
  .fa-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    border: 1px solid var(--global-divider-color);
    border-top: 0;
    background: var(--global-card-bg-color);
    padding: 0.4rem 0.6rem;
  }
  .fa-tbtn {
    background: var(--global-code-bg-color);
    color: var(--global-text-color);
    border: 1px solid var(--global-divider-color);
    border-radius: 0.35rem;
    padding: 0.15rem 0.6rem;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .fa-tbtn:hover {
    border-color: var(--global-theme-color);
    color: var(--global-theme-color);
  }
  .fa-page {
    width: 3.4rem;
    background: var(--global-code-bg-color);
    border: 1px solid var(--global-divider-color);
    border-radius: 0.35rem;
    color: var(--global-text-color);
    padding: 0.15rem 0.3rem;
    font-size: 0.85rem;
    text-align: center;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  .fa-page::-webkit-outer-spin-button,
  .fa-page::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .fa-page-label,
  .fa-page-total,
  .fa-zoom {
    font-size: 0.83rem;
    color: var(--global-text-color-light);
  }
  .fa-zoom {
    min-width: 3rem;
    text-align: center;
  }
  .fa-spacer {
    flex: 1 1 auto;
  }
  .fa-viewer-frame {
    position: relative;
    height: 76vh;
    border: 1px solid var(--global-divider-color);
    border-top: 0;
    border-radius: 0 0 0.5rem 0.5rem;
    background: var(--global-code-bg-color);
    overflow: hidden;
    --pdfViewer-padding-bottom: 28px;
    --page-margin: 12px auto;
    --page-border: none;
  }
  .fa-viewer {
    position: absolute;
    inset: 0;
    overflow: auto;
    outline: none;
  }
  .fa-viewer > .pdfViewer {
    padding: 18px 0 40px;
  }
  .pdfViewer .page {
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.18);
  }
  .fa-placeholder[hidden],
  .fa-meta[hidden],
  .fa-toolbar[hidden] {
    display: none !important;
  }
  .fa-placeholder {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--global-text-color-light);
    background: var(--global-code-bg-color);
    padding: 1rem;
    font-size: 0.95rem;
  }
  @media (max-width: 767.98px) {
    .fa-layout {
      flex-direction: column;
    }
    .fa-index {
      flex: none;
      width: 100%;
      max-height: 42vh;
    }
    .fa-viewer-frame {
      height: 62vh;
    }
  }
---

<link rel="stylesheet" href="{{ '/assets/pdfjs/pdf_viewer.css' | relative_url }}" />
<link rel="modulepreload" href="{{ '/assets/pdfjs/build/pdf.mjs' | relative_url }}" />
<link rel="modulepreload" href="{{ '/assets/pdfjs/web/pdf_viewer.mjs' | relative_url }}" />

<div
  id="film-archive"
  data-catalog="{{ '/assets/filmarchive/catalog.json' | relative_url }}"
  data-pdfjs="{{ '/assets/pdfjs/' | relative_url }}"
>
  <div class="fa-layout">
    <nav class="fa-index" id="fa-index" aria-label="Film archive document index"></nav>
    <section class="fa-reader" aria-label="Document reader">
      <div class="fa-meta" id="fa-meta" hidden></div>
      <div class="fa-toolbar" id="fa-toolbar" hidden>
        <button type="button" class="fa-tbtn" id="fa-prev" aria-label="Previous page">‹ Prev</button>
        <button type="button" class="fa-tbtn" id="fa-next" aria-label="Next page">Next ›</button>
        <label class="fa-page-label" for="fa-page">Page</label>
        <input type="number" id="fa-page" class="fa-page" min="1" value="1" aria-label="Page number" />
        <span class="fa-page-total" id="fa-page-total">/ –</span>
        <span class="fa-spacer"></span>
        <button type="button" class="fa-tbtn" id="fa-zoom-out" aria-label="Zoom out">−</button>
        <span class="fa-zoom" id="fa-zoom">100%</span>
        <button type="button" class="fa-tbtn" id="fa-zoom-in" aria-label="Zoom in">+</button>
        <button type="button" class="fa-tbtn" id="fa-fit" aria-label="Fit page to width">Fit width</button>
        <button type="button" class="fa-tbtn" id="fa-open" aria-label="Open the PDF file in a new tab">Open ↗</button>
      </div>
      <div class="fa-viewer-frame" id="fa-viewer-frame">
        <div id="fa-viewer" class="fa-viewer" tabindex="0">
          <div class="pdfViewer"></div>
        </div>
        <div class="fa-placeholder" id="fa-placeholder">Select a document from the index to open it in the reader.</div>
        <div class="fa-placeholder" id="fa-viewer-loading" hidden>Loading document…</div>
        <div class="fa-placeholder" id="fa-viewer-error" hidden>
          Failed to load this document.
          <button type="button" class="fa-tbtn" id="fa-retry">Retry</button>
        </div>
      </div>
    </section>
  </div>
</div>

<script type="module" src="{{ '/assets/js/filmarchive.js' | relative_url }}"></script>
