# W06 Rubric Release Audit

Treat each unchecked item as **not yet verified**. A successful build or passed local tests is not proof of a live deployment or Lighthouse score.

## 20 points — Core build and deployment

- [ ] Live URL loads, and `/signup`, `/login`, `/dashboard`, `/review`, `/studysets/library` work when appropriate.
- [ ] App deployed with no fatal production errors or broken routes.
- [ ] At least five **meaningful merged PRs** or instructor-accepted feature branch history verified using GitHub; do not create empty PRs merely to reach a number.
- [x] New code follows Next.js App Router directory conventions.

## 20 points — Data & architecture

- [x] `GET /api/v1/study-sets` reads real authenticated PostgreSQL data.
- [x] `StudySetApiLibrary` client calls the endpoint using `fetch()`.
- [x] `PATCH /api/v1/study-sets/[id]` performs a real ownership-scoped update.
- [ ] Local API integration tests and production database connection verified.

## 20 points — Features

- [x] The starting source implements authentication and guarded pages.
- [x] Three meaningful dynamic views: dashboard, study set detail, review.
- [x] CRUD: study sets (new form, GET, rename PATCH, delete action).
- [x] CRUD: flashcards (generation, read, edits, deletion).
- [ ] Confirm all four CRUD operations in the updated full E2E suite.

## 15 points — Engineering quality

- [x] Five shared typed components: PageContainer, PageHeader, SurfacePanel, ActionLink, BackLink; used across multiple pages.
- [x] Existing `.prettierrc` present; consistent formatting target.
- [ ] `npx tsc --noEmit` and `npm run lint` pass after this patch.

## 15 points — Design & UX

- [x] Shared layout and high-contrast light palette; mobile-first spacing.
- [ ] Verify at 375px and 768px wide (no horizontal overflow or unusable controls).
- [ ] Run Chrome incognito **mobile Lighthouse** on public and authenticated pages.
- [ ] Save four Lighthouse category reports, address all critical issues.
- [ ] Confirm CSS Overview reports no color contrast errors.

## 5 points — Documentation

- [x] Expanded README with description, team, setup, deployment, API documentation and limitations.
- [ ] Verify setup instructions against a clean installation and actual production database.

## 5 points — Product demo

- [x] Three-paragraph written summary `docs/W06_PRODUCT_DEMO.md`.
- [ ] Record or present a product demo and submit repository/live URLs.

## Submission links

- Repository: https://github.com/jalfredobecerra/studyflow
- Deployment: https://studyflow-lime-two.vercel.app/
- Product demo summary: `docs/W06_PRODUCT_DEMO.md`
