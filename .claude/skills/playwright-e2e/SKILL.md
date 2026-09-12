---
name: playwright-e2e
description: Use whenever writing or updating a Playwright test in tests/e2e/, adding data-testid attributes to a new UI element, or a task mentions testing a user-facing flow (signup, publish, subscribe, paywall) in this repo. Also use when a test is flaky or failing intermittently.
---

# Playwright conventions (Inkwell)

## Where tests live
One spec file per user-facing flow in `tests/e2e/`, named after the flow (`auth.spec.ts`, `publish-flow.spec.ts`, `paywall.spec.ts`), not after the page or component. A flow that spans multiple pages (signup → create publication → write → publish) stays in one test, one `test()` block, so a break anywhere in the chain fails clearly at the step it broke rather than needing three separate specs stitched together mentally.

## Selecting elements
Always select by `data-testid`, added on the element in the Vue template, never by CSS class, text content of a styled element, or nth-child. Text-based `getByText()` is fine only for asserting *content* (e.g. confirming a post title appears), not for driving interactions with controls — copy changes shouldn't break tests that don't care about copy.

Naming pattern: `kebab-case`, verb or noun describing the element's job, scoped enough to be unique on the page: `signup-submit`, `post-visibility`, `paywall-card`. Don't reuse a testid across two different components/pages for two different things.

## Test data
- Use `testUser()` and `uniqueSuffix()` from `tests/e2e/fixtures.ts` for anything that hits a `unique` DB constraint (emails, publication subdomains, post slugs). Hardcoded values collide on reruns and between parallel workers.
- Don't seed data by calling Supabase directly from the test — go through the UI (sign up via `/signup`, create a publication via the dashboard form). This keeps tests honest about what a real user path exercises, and means a broken form surfaces as a test failure instead of being silently bypassed.
- Exception: if a future flow needs data that's impractical to create via UI (e.g. 100 subscribers to test pagination), it's fine to seed via the Supabase JS client in a `test.beforeAll`, but keep that seeding code in the spec file itself, clearly commented, not hidden in a shared helper.

## Multi-user flows
For flows involving two different signed-in users (see `paywall.spec.ts`), use `browser.newContext()` for the second user rather than logging out/in on the same page — this is closer to reality (two people, two browsers) and avoids session-state bleed between the writer and reader actions.

## Running locally
`npm run test:e2e` starts the dev server itself via Playwright's `webServer` config — no need to run `npm run dev` in a separate terminal first. Point `NUXT_PUBLIC_SITE_URL` at a deployed preview instead of localhost to run the same suite against a staging environment.

## When a test is flaky
Check, in order: (1) a `unique` constraint collision from reused test data — fix by using `testUser()`/`uniqueSuffix()`; (2) a missing `await expect(...).toBeVisible()` before interacting with an element that appears after an async Supabase call — Playwright auto-waits on assertions but not on plain `.click()` timing; (3) RLS returning zero rows because the test user isn't entitled yet — check subscription/auth state was actually established before the assertion, not just that the API call resolved.
