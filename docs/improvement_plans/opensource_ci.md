# Open Source and CI/CD

## 1. CI Automation
**Tool:** GitHub Actions
**Plan:**
- `build.yml`: Build apps on every PR.
- `lint.yml`: ESLint + Prettier check.
- `test.yml`: Run `vitest`.
- `release.yml`: Automate Tauri build & release for Mac/Windows/Linux.

## 2. Open Source Hygiene
- `issue_templates`: structured bug reports.
- `pull_request_template`: required checklist (tests, docs).
- `CODE_OF_CONDUCT.md`.

## 3. Deployment
- Auto-deploy documentation to GitHub Pages.
- Nightly builds via GitHub Releases.
