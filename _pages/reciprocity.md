---
layout: page
title: Reciprocity Calculator
permalink: /tools/reciprocity/
description: >-
  Correct long-exposure times for reciprocity failure using published manufacturer data.
  Pick a film stock, enter the metered time, and get the corrected exposure.
_styles: |
  .rc-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .rc-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }
  .rc-field label {
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--global-text-color-light);
  }
  .rc-field select,
  .rc-field input {
    background: var(--global-card-bg-color);
    color: var(--global-text-color);
    border: 1px solid var(--global-divider-color);
    border-radius: 0.35rem;
    padding: 0.42rem 0.6rem;
    font-size: 0.95rem;
    font-family: inherit;
  }
  .rc-field select {
    min-width: 22rem;
    max-width: 100%;
  }
  .rc-field input {
    width: 9rem;
  }
  .rc-field select:focus-visible,
  .rc-field input:focus-visible {
    outline: 2px solid var(--global-theme-color);
    outline-offset: 1px;
  }
  .rc-check {
    flex-direction: row;
    align-items: center;
    gap: 0.45rem;
    padding-bottom: 0.45rem;
  }
  .rc-check input {
    width: auto;
  }
  .rc-check label {
    font-weight: 400;
    font-size: 0.9rem;
    color: var(--global-text-color);
  }
  .rc-result {
    border: 1px solid var(--global-divider-color);
    border-radius: 0.5rem;
    background: var(--global-card-bg-color);
    padding: 1rem 1.15rem;
    margin-bottom: 1.25rem;
  }
  .rc-result-main {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 1.5rem;
  }
  .rc-big {
    font-size: 1.85rem;
    font-weight: 600;
    line-height: 1.2;
    color: var(--global-theme-color);
    font-variant-numeric: tabular-nums;
  }
  .rc-big-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--global-text-color-light);
    display: block;
  }
  .rc-figures {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.75rem;
    margin-top: 0.85rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--global-divider-color);
  }
  .rc-figure {
    font-size: 0.9rem;
    color: var(--global-text-color);
    font-variant-numeric: tabular-nums;
  }
  .rc-figure span {
    color: var(--global-text-color-light);
  }
  .rc-note {
    margin-top: 0.85rem;
    font-size: 0.88rem;
    line-height: 1.6;
    color: var(--global-text-color-light);
  }
  .rc-badge {
    display: inline-block;
    padding: 0.06rem 0.5rem;
    border-radius: 999px;
    background: var(--global-code-bg-color);
    color: var(--global-text-color);
    font-size: 0.74rem;
    white-space: nowrap;
  }
  .rc-warn {
    border-left: 3px solid #b29400;
    background: rgba(231, 192, 0, 0.12);
    border-radius: 0 0.35rem 0.35rem 0;
    padding: 0.7rem 0.9rem;
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1.25rem;
    color: var(--global-text-color);
  }
  .rc-source {
    font-size: 0.84rem;
    color: var(--global-text-color-light);
    line-height: 1.6;
  }
  .rc-source a {
    color: var(--global-theme-color);
    text-decoration: none;
  }
  .rc-source a:hover {
    text-decoration: underline;
  }
  .rc-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--global-divider-color);
    border-radius: 0.5rem;
    margin-top: 1.75rem;
  }
  .rc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.87rem;
    margin: 0;
  }
  .rc-table caption {
    caption-side: top;
    text-align: left;
    padding: 0.7rem 0.9rem;
    font-weight: 600;
    font-size: 0.92rem;
    color: var(--global-text-color);
    background: var(--global-card-bg-color);
    border-bottom: 1px solid var(--global-divider-color);
  }
  .rc-table th,
  .rc-table td {
    padding: 0.45rem 0.9rem;
    text-align: left;
    border-bottom: 1px solid var(--global-divider-color);
    color: var(--global-text-color);
  }
  .rc-table thead th {
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--global-text-color-light);
    background: var(--global-code-bg-color);
  }
  .rc-table tbody tr:last-child td {
    border-bottom: 0;
  }
  .rc-table td.rc-num {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  @media (max-width: 575.98px) {
    .rc-field select {
      min-width: 0;
      width: 100%;
    }
    .rc-field,
    .rc-field input {
      width: 100%;
    }
    .rc-big {
      font-size: 1.5rem;
    }
  }
---

<div id="reciprocity-calculator" data-data-url="{{ '/assets/js/reciprocity-data.js' | relative_url }}">
  <div class="rc-form">
    <div class="rc-field">
      <label for="rc-film">Film stock</label>
      <select id="rc-film"></select>
    </div>
    <div class="rc-field">
      <label for="rc-time">Metered exposure time</label>
      <input id="rc-time" type="number" min="0" step="any" value="10" inputmode="decimal" />
    </div>
    <div class="rc-field">
      <label for="rc-unit">Unit</label>
      <select id="rc-unit">
        <option value="1">seconds</option>
        <option value="60">minutes</option>
        <option value="3600">hours</option>
      </select>
    </div>
    <div class="rc-field rc-check">
      <input id="rc-push" type="checkbox" />
      <label for="rc-push">Include &#189;-stop rounding</label>
    </div>
  </div>

  <div class="rc-warn" id="rc-no-data" hidden></div>
  <div class="rc-result" id="rc-result" hidden></div>
  <div class="rc-source" id="rc-source"></div>

  <div class="rc-table-wrap">
    <table class="rc-table" id="rc-table">
      <caption>Published correction curve for the selected film</caption>
      <thead>
        <tr>
          <th scope="col">Metered time</th>
          <th scope="col">Correction</th>
          <th scope="col">Corrected time</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>

<script type="module" src="{{ '/assets/js/reciprocity.js' | relative_url }}"></script>
