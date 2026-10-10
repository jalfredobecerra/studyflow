# Study Flow

**Live application:** https://studyflow-lime-two.vercel.app/  
**Repository:** https://github.com/jalfredobecerra/studyflow

Study Flow is a full-stack student study manager built with the **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS 4**, **Auth.js credentials**, and **PostgreSQL**. Students turn notes into editable flashcards, complete timed review sessions, track progress and streaks, personalize review cadence, and manage their private study data.

## Team members

- **Julian Becerra** — software engineering, front-end and back-end implementation, database, testing, and deployment.

## Problem and target audience

Students studying for courses and exams often have unstructured notes but no consistent review plan. Study Flow converts notes into rule-based flashcards, lets students review due cards, and shows progress toward regular study habits. It is designed for individual students and self-directed learners.

## Implemented features

- Credential signup, login, logout, onboarding and route protection.
- Create a study set from notes and generate flashcards using a **deterministic text parser** (not a hosted AI model).
- Read, edit, accept, reject and delete flashcards.
- Browse study sets and **rename** them through an authenticated client-to-API-to-PostgreSQL workflow; delete sets from their management pages.
- Flashcard difficulty, mastery state, due dates and review scheduling.
- Timed review sessions, completed-session history, unique cards reviewed, and UTC-based streak counts.
- Personal study goal, subject, review cadence and preferred session length.
- Account deletion with confirmation and ownership checks.
- Server-rendered dashboard and browser-fetched study-set library.

## Routes and architecture

| App Router path          | Purpose                              | Rendering                             |
| ------------------------ | ------------------------------------ | ------------------------------------- |
| `/`                      | Public landing page                  | Server component                      |
| `/signup`, `/login`      | Account access                       | Server pages with client forms        |
| `/onboarding`            | Study preferences                    | Server page with client form          |
| `/dashboard`             | Due cards, statistics and study sets | Server component querying PostgreSQL  |
| `/studysets/new`         | Create study sets                    | Client form with Server Action        |
| `/studysets/[id]`        | Read/update flashcards               | Server page + client editors          |
| `/studysets/library`     | Live API-powered library and rename  | Server page + client fetch component  |
| `/studysets/manage/[id]` | Update card settings and delete      | Server page + forms                   |
| `/review`                | Due flashcard review and timer       | Server page + client review component |
| `/preferences`           | Preferences and account deletion     | Server page + client form             |

The browser **`StudySetApiLibrary` client component** calls `GET /api/v1/study-sets` with `fetch()`. The **App Router route handler** authenticates the user and queries real PostgreSQL rows. When renaming a set, the same client issues `PATCH /api/v1/study-sets/{id}`; the route validates the request and updates only rows owned by that user. This demonstrates the required client → server → database → client round trip.

### API reference (implemented endpoints)

All endpoints require an active logged-in session; unauthenticated requests receive `401`. Responses are JSON and are marked private/no-store.

| Method | Endpoint                  | Function                                                        | Success | Errors                     |
| ------ | ------------------------- | --------------------------------------------------------------- | ------- | -------------------------- |
| GET    | `/api/v1/study-sets`      | List only the signed-in user's study sets with real card counts | `200`   | `401`, `500`               |
| GET    | `/api/v1/study-sets/{id}` | Read an owned study set summary                                 | `200`   | `400`, `401`, `404`, `500` |
| PATCH  | `/api/v1/study-sets/{id}` | Rename an owned study set                                       | `200`   | `400`, `401`, `404`, `500` |

Example PATCH request from the authenticated browser:

```ts
await fetch(`/api/v1/study-sets/${studySetId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Software Architecture Review" }),
});
```

Example successful listing response (IDs and counts shown are illustrative):

```json
{
  "studySets": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "title": "Software Architecture Review",
      "cardCount": 4,
      "acceptedCount": 2,
      "updatedAt": "2026-10-08T12:00:00.000Z"
    }
  ]
}
```

For creation, review ratings and deletion, the application additionally uses authenticated **Server Actions**, which are not the same as the HTTP API endpoints above. The original `spec.md` lists additional _planned_ APIs that have not all been implemented; do not describe those planned routes as available.

## CRUD evidence (two data models)

| Model      | Create                                | Read                        | Update                                             | Delete                          |
| ---------- | ------------------------------------- | --------------------------- | -------------------------------------------------- | ------------------------------- |
| Study sets | Notes form / Server Action            | Dashboard, detail, API GET  | Library API PATCH title                            | Management form / Server Action |
| Flashcards | Generated and inserted with study set | Study set detail and review | Front/back editor, acceptance, difficulty, mastery | Management form / Server Action |

## Reused UI components

`src/app/ui/layout-primitives.tsx` contains **five typed reusable components** used by multiple pages: `PageContainer`, `PageHeader`, `SurfacePanel`, `ActionLink`, and `BackLink`. Shared forms and editors live in `src/app/ui/`.

## Local development setup

1. Install **Node.js 22** and obtain a PostgreSQL database.
2. Clone the repository: `git clone https://github.com/jalfredobecerra/studyflow.git`.
3. Change into the project directory: `cd studyflow`.
4. Install dependencies: `npm ci`.
5. Create `.env.local` in the project root (do not commit it):

   ```env
   POSTGRES_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
   AUTH_SECRET=replace-with-a-long-random-secret
   AUTH_TRUST_HOST=true
   ```

   Generate a secret with `npx auth secret` if supported by your Auth.js setup, or another secure random secret generator. Some managed PostgreSQL providers require SSL; use connection settings appropriate to yours.

6. Create the **users**, **study_sets** and **flashcards** tables using your existing database schema and apply the checked-in migrations in order. The repository includes migration files `007_010_reviews_and_sessions.sql`, `011_fix_flashcard_mastery_states.sql`, and `012_fix_flashcard_difficulty.sql`; these are **incremental migrations, not a complete initial schema**. Obtain the initial SQL schema from the existing development database or your project's SQL setup before running them on an empty database. For SQL clients that use prepared statements, execute each top-level SQL statement separately.
7. Start the development server with `npm run dev` and visit http://localhost:3000.

## Production deployment (Vercel)

1. Import this GitHub repository into Vercel and select the Next.js framework.
2. Configure `POSTGRES_URL` and `AUTH_SECRET` (and other Auth.js environment settings required by your host).
3. **Back up the production database.** Apply schema migrations to the database used by the production deployment **before** enabling the new routes.
4. Deploy the chosen release branch or merge a reviewed PR into `main` if Vercel deploys `main`.
5. Verify signup, login, dashboard, study set creation, API library loading and renaming, reviews, logout and mobile layout on the live site. Do not run destructive test suites against production.

## Tests and engineering checks

```powershell
npx vitest run
npx tsc --noEmit
npm run lint
npm run build -- --webpack
```

For end-to-end tests, use **a disposable test database** with the correct schema and test-only credentials:

```powershell
$env:AUTH_TRUST_HOST="true"
$env:PW_PRODUCTION="1"
npm run build -- --webpack
npx playwright test --workers=1
```

The original branch passed 10 Playwright browser tests and 15 Vitest tests before these W06 changes. **The new changes require rerunning every check; prior results do not certify this patch.** The added `study-set-api.spec.ts` verifies unauthenticated access, the client fetch and PATCH persistence, input validation, and ownership isolation.

## UI design and accessibility

- Light, high-contrast indigo/slate palette, consistent typography, and shared responsive layout components.
- Input labels, visible keyboard focus, button disabled states and status/error messaging.
- Test desktop and mobile in an **incognito browser session** using Lighthouse for Performance, Accessibility, Best Practices and SEO. Save the Lighthouse reports with the assignment; a successful build alone does not establish these scores.

## Known issues and opportunities

- The initial flashcard generator is a deterministic text parser, **not a third-party AI model**; improving generation quality is future work.
- The countdown timer belongs to review sessions; a standalone focus mode could be added later.
- Streaks are calculated using UTC calendar dates rather than the user's selected timezone.
- Initial-schema SQL is not checked into this snapshot; document the exact starting schema before provisioning a new database.
- API rate limiting and advanced CSRF protections can be hardened before public-scale use.
- Lighthouse results, production deployment, and five merged PRs must be **independently verified** for the final W06 submission.

## Product demo

See [`docs/W06_PRODUCT_DEMO.md`](docs/W06_PRODUCT_DEMO.md) for the required three-paragraph product summary. The demo should show signup, study-set generation, review scheduling, API-based renaming, session progress and data ownership.
