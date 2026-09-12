# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Inkwell — project instructions for Claude Code

Inkwell is a Substack-style publishing app. Nuxt 3 (Vue) frontend, Supabase (Postgres + Auth + Storage) backend. This is the **Phase 1 MVP**: free subscriptions only, path-based publication routing (`/p/:subdomain`), no Stripe/paid tiers yet.

## Stack quick reference
- Frontend: Nuxt 3, `@nuxtjs/supabase`, `@nuxtjs/tailwindcss`
- Editor: Tiptap (`@tiptap/vue-3`) — post `body` is stored as Tiptap JSON in `posts.body`, never HTML
- DB/Auth: Supabase Postgres with Row Level Security — see `supabase/migrations/`
- Tests: Playwright, `tests/e2e/`

## Commands
- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` / `npm run generate` / `npm run preview` — production build, static generate, and preview a build
- `npm run db:push` — apply migrations (`supabase/migrations/`) to the linked Supabase project
- `npm run db:reset` — reset the linked project's DB to match migrations (destructive; not in the default allowed-commands list in `.claude/settings.json` for that reason)
- `npm run test:e2e` — run the full Playwright suite (spins up `npm run dev` itself via `webServer` in `playwright.config.ts`)
- `npm run test:e2e:ui` — Playwright's interactive UI mode, useful while iterating
- `npx playwright test tests/e2e/paywall.spec.ts` — run a single spec file
- `npx playwright test -g "some test name"` — run tests matching a title

Tests run against whatever Supabase project the local env points to — always a scratch project or `supabase start`, never production (see "Before opening a PR" below).

## Architecture

**Routing.** File-based via `pages/`:
- `pages/index.vue`, `pages/login.vue`, `pages/signup.vue` — public, unauthenticated
- `pages/p/[subdomain]/index.vue` and `pages/p/[subdomain]/[slug].vue` — public reader-facing side: publication home and individual post
- `pages/dashboard/index.vue`, `pages/dashboard/new-post.vue`, `pages/dashboard/posts/[id].vue` — authenticated writer side

There is no global auth middleware. Each dashboard page opts in individually with `definePageMeta({ middleware: 'auth' })`, which runs `middleware/auth.ts` — it redirects to `/login?redirect=...` if `useSupabaseUser()` is null. When adding a new writer-only page, you must add that `definePageMeta` call yourself; it isn't automatic. `@nuxtjs/supabase`'s own route-level redirect is turned off (`redirect: false` in `nuxt.config.ts`) in favor of this per-page middleware.

**Auth/DB client.** `@nuxtjs/supabase` auto-imports `useSupabaseClient()` and `useSupabaseUser()` — pages/components call these directly rather than instantiating a Supabase client manually.

**Data model & the paywall (`supabase/migrations/0001_init.sql`).** Four tables: `profiles` (1:1 shadow of `auth.users`, auto-created via `handle_new_user()` trigger), `publications` (one per writer — `owner_id` is `unique`), `posts` (`body` is Tiptap JSON; `visibility` is `public`/`subscribers`/`paid`; `status` is `draft`/`published`), and `subscriptions` (`tier`/`stripe_subscription_id` columns exist for Phase 2 but are unused now).

Row-level `select` policies on `posts` allow reading a gated row's metadata (title/excerpt) even when the caller isn't entitled to the body — RLS alone cannot redact a single column. The actual gating happens in `get_post_for_reader(p_publication_id, p_slug)`, a `security definer` RPC that looks up the post, checks entitlement (public post, or an `active` row in `subscriptions` for the caller), and returns `body` as `null` plus `is_locked: true` when not entitled. **The reader-facing pages must call this RPC, not `select` the `posts` table directly** — see convention #1 below and the `supabase-rls` skill for the full pattern when extending it.

**Design tokens** (`tailwind.config.ts`): `ink`/`paper`/`paper-raised`/`teal`/`gold`/`line` colors, `display`/`body`/`mono` font families (Fraunces/Inter/IBM Plex Mono).

## Conventions Claude should follow in this repo

1. **Never bypass RLS for reader-facing paths.** Post bodies are gated in the database via `get_post_for_reader()`, not by hiding markup in the client. If you add a new gated field, extend that function — don't add a client-side `if (subscribed)` check as the only guard.
2. **Every new interactive element needs a `data-testid`.** Playwright tests select by test id, not CSS classes or text where avoidable, so UI copy can change without breaking tests. Follow the existing naming pattern: `kebab-case`, scoped to what it does (`post-title`, `publish-post`, `subscribe-button`).
3. **Schema changes go in a new numbered migration file**, e.g. `0002_add_paid_tier.sql` — never edit `0001_init.sql` after it's been applied anywhere. Include the RLS policy changes in the same migration as the schema change that motivates them.
4. **Design tokens live in `tailwind.config.ts`.** Use `paper` / `ink` / `teal` / `gold` and the `display`/`body`/`mono` font families rather than introducing new ad hoc colors.
5. **Path-based publication routing is intentional for Phase 1.** Don't migrate to subdomain-based routing (`writer.inkwell.app`) without discussing it first — that requires wildcard DNS + hosting changes out of scope for the MVP.
6. **Stripe/paid tiers are Phase 2.** The `tier`/`stripe_subscription_id` columns already exist on `subscriptions` (and `runtimeConfig` already has `stripeSecretKey`/`stripeWebhookSecret` slots) so the schema/config don't need to change, but don't wire up billing UI unless explicitly asked.

## Before opening a PR
- Run `npm run test:e2e` locally against a scratch Supabase project (or `supabase start` for local dev) — all three specs in `tests/e2e/` should pass. Tests create real users/publications with randomized names/emails (`tests/e2e/fixtures.ts`) and don't clean up after themselves, so don't point them at production data.
- New pages/components that render user-facing UI should be checked against `/mnt/skills/public/frontend-design` conventions if you have access to it, or at minimum reuse the existing token system rather than inventing new colors/fonts.

## Directory map
- `pages/` — file-based routes. `pages/p/[subdomain]/` is the public reader-facing side; `pages/dashboard/` is the authenticated writer side.
- `components/PostEditor.vue` — the Tiptap wrapper; extend its toolbar here, not inline in pages. `components/SiteHeader.vue` — shared header/nav.
- `middleware/auth.ts` — per-page auth guard, opted into via `definePageMeta({ middleware: 'auth' })` (see Architecture above).
- `supabase/migrations/` — source of truth for schema + RLS. Apply with `npm run db:push`.
- `tests/e2e/` — Playwright specs, one file per user-facing flow (`auth`, `publish-flow`, `paywall`), plus `fixtures.ts` for shared test-data helpers.

## Project skills
Two project skills load automatically when a task matches their scope:
- `.claude/skills/supabase-rls/` — how to add/change tables and RLS policies here, including the redaction pattern used for the paywall
- `.claude/skills/playwright-e2e/` — test-writing conventions, test data helpers, and a flakiness-debugging checklist
