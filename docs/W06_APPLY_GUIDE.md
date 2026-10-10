# Applying the W06 patch to Study Flow

These instructions apply to source snapshot `1138a0fdf65afa4251ccb03f50ca09725922721f` (the uploaded `studyflow-source.zip`). **Every modified file in this archive is a complete replacement**, not a snippet. Extract the ZIP at the repository root, not inside another folder.

## 0. Protect your working tree

```powershell
cd C:\Users\Lenovo\Documents\wdd430\studyflow
git status
```

If your working tree is not clean, stop and save or commit your existing changes first. Before making more feature branches, check whether PR #13 (reviews/progress) has been merged. If it remains open, use its feature branch as the base, and create the next PR targeting that branch (stacked PR); after #13 merges, retarget to `main` and recheck the diff. If #13 is merged, start from updated `main` instead and ensure it includes commit `1138a0f`.

## 1. Create the API and architecture branch (#14)

Start from the code containing commit `1138a0f`. For example, while #13 remains open:

```powershell
git switch feature/reviews-progress-preferences-deletion
git switch -c feature/w06-api-crud-shared-ui
```

Extract `studyflow_w06_complete_patch.zip` **into the root of this repository** with Windows Explorer or PowerShell:

```powershell
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\studyflow_w06_complete_patch.zip" -DestinationPath (Get-Location).Path -Force
```

Stage ONLY these code and test files for PR #14 (the other patch files can remain in the working tree until PR #15):

```powershell
git add -- src/app/api src/lib/study-set-api-auth.ts src/lib/study-set-api-types.ts src/app/ui/layout-primitives.tsx src/app/ui/study-set-api-library.tsx src/app/studysets/library src/app/studysets/new/page.tsx src/app/review/page.tsx src/app/preferences/page.tsx 'src/app/studysets/manage/[id]/page.tsx' src/app/dashboard/page.tsx tests/e2e/study-set-api.spec.ts
```

Verify the staged files; run tests after **all patch files are present** (the files not staged still exist locally):

```powershell
git --no-pager diff --cached --stat
git --no-pager diff --cached --check
npx prettier --write src/app src/lib tests/e2e/study-set-api.spec.ts
npx tsc --noEmit
npm run lint
npx vitest run
$env:NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=32"
npm run build -- --webpack
$env:AUTH_TRUST_HOST="true"
$env:PW_PRODUCTION="1"
npx playwright test --workers=1
```

**Important:** Prettier can modify other files in `src/app` and `src/lib` besides the PR #14 targets. Rerun `git status` and stage only the intended, tested code files before committing. Run Playwright against a disposable test database.

```powershell
git add -- src/app/api src/lib/study-set-api-auth.ts src/lib/study-set-api-types.ts src/app/ui/layout-primitives.tsx src/app/ui/study-set-api-library.tsx src/app/studysets/library src/app/studysets/new/page.tsx src/app/review/page.tsx src/app/preferences/page.tsx 'src/app/studysets/manage/[id]/page.tsx' src/app/dashboard/page.tsx tests/e2e/study-set-api.spec.ts
git commit -m "feat: add authenticated study set API and full CRUD with shared UI"
git push -u origin feature/w06-api-crud-shared-ui
```

Open PR #14. While #13 is open, compare against its feature branch rather than main to avoid unrelated changes. Do not merge before checking the branch relationships and status checks.

## 2. Create the design and documentation branch (#15)

After committing #14, leave the unstaged docs/design changes in place and start a new branch from #14:

```powershell
git switch -c feature/w06-design-docs
```

Stage these separate changes:

```powershell
git add -- README.md docs .gitignore next.config.ts src/app/globals.css
```

`test-results/.last-run.json` is tracked in the uploaded snapshot. To prevent accidentally committing automated test outputs in the future, remove it from version control _but keep the local file_:

```powershell
git rm --cached -- test-results/.last-run.json
```

Review, commit and push:

```powershell
git --no-pager diff --cached --stat
git --no-pager diff --cached --check
git commit -m "docs: complete W06 submission and unify responsive design"
git push -u origin feature/w06-design-docs
```

Open PR #15 targeting #14 until it merges, or target `main` after #14 is merged. The school rubric requires at least **five merged PRs or qualifying feature-branch history**; merely opening PRs is not sufficient. PRs #11/#12/#13 plus #14/#15 provide five _meaningful_ PRs, but verify their actual merged state.

## 3. Deployment and Lighthouse

- Confirm all GitHub checks pass and merge in dependency order.
- Verify production environment configuration in Vercel. No new database migration is required for **this patch**, assuming the `study_sets.updated_at` column already exists as in the uploaded source.
- Run browser smoke tests on https://studyflow-lime-two.vercel.app/ after release. Test API library, rename persistence and ownership.
- Run mobile Lighthouse in Chrome incognito and record Performance, Accessibility, Best Practices and SEO results. Correct critical issues; Lighthouse cannot be certified from source code alone.
- Add repository and live URLs, a demo, and `docs/W06_PRODUCT_DEMO.md` to your course submission.

## Troubleshooting

- If `git switch -c` reports an existing branch, choose another descriptive name or inspect existing branches.
- If the API gives `401`, make sure you signed in and that Auth.js session cookies are present.
- If the API gives `500`, verify `POSTGRES_URL`, `users`, `study_sets`, `flashcards` and `updated_at` in the development database.
- If you see Next.js `package-lock.json` warnings, confirm `next.config.ts` contains `outputFileTracingRoot: process.cwd()`; verify in the next successful build rather than assuming warnings are fixed.
- Never use production credentials or a live database when running deletion tests.
