# Repository Guidelines

## Project Structure & Module Organization
This repository is a Jekyll-based academic site built from content collections and shared Liquid templates. Put page content in `_pages/`, posts in `_posts/`, news in `_news/`, and project entries in `_projects/`. Store bibliography data in `_bibliography/`, site data in `_data/`, theme logic in `_includes/`, `_layouts/`, `_plugins/`, and `_sass/`, and static files in `assets/`.

## Build, Test, and Development Commands
Do not build or serve the site locally as part of routine contributions. GitHub Actions compiles and deploys after push, so local work should stay focused on content, templates, and configuration. The main local check is formatting:

```bash
npx prettier . --check
npx prettier . --write
```

Use `git status` and `git diff --stat` before pushing.

## Coding Style & Naming Conventions
Follow Prettier as the source of truth. The repo uses `@shopify/prettier-plugin-liquid`, `printWidth: 150`, and trailing commas where valid. Keep front matter minimal and accurate. Use lowercase, date-based post names like `YYYY-MM-DD-title.md` and clear asset paths such as `assets/img/profile.jpg`. Fail fast: do not add defensive logic that hides broken data or template errors. Let failures surface, then fix the source issue at the root.

## Testing Guidelines
There is no dedicated unit-test suite in this repo. Do not spend time on local site builds; GitHub Actions handles compilation, link checks, deployment, and optional accessibility checks after push. Before opening a PR, run a Prettier check and review changed Markdown, Liquid, YAML, and asset paths carefully.

## Agent-Specific Instructions
When contributing through an agent workflow, focus on repository content that fits the existing al-folio template. Prefer fixing source files in `_pages/`, `_posts/`, `_projects/`, `_data/`, and related includes rather than adding local build steps or compile-specific patches.

## Commit & Pull Request Guidelines
Recent commits use short lowercase subjects such as `update 20250225`. Keep commit messages concise and focused on one change. For minor fixes, open a PR directly. For new features or bug fixes, open or reference an issue first, as requested in `CONTRIBUTING.md`. Include screenshots for visible UI or layout updates.
