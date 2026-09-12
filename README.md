# Inkwell — Substack-style publishing app (Phase 1 MVP)

Nuxt 3 + Supabase. Free-tier subscriptions, path-based publications (`/p/:subdomain`), Tiptap rich-text posts, RLS-enforced paywall. See `CLAUDE.md` for the fuller design/architecture notes and repo conventions.

## Scope

Included in this MVP:
- Email/password auth (Supabase Auth)
- One publication per writer
- Rich-text post editor (draft → publish)
- Public/subscribers-only post visibility, enforced in Postgres via RLS + a redacting RPC (`get_post_for_reader`) — not just hidden in the client
- Free subscriptions

Deferred to later phases (see the architecture plan): Stripe paid tiers, subdomain-based routing, comments, analytics, multi-author publications.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com), or run one locally with the [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase start`.
2. **Copy env vars**:
   ```bash
   cp .env.example .env
   # fill in SUPABASE_URL and SUPABASE_KEY from Project Settings > API
   ```
3. **Apply the schema**:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npm run db:push
   ```
   This runs `supabase/migrations/0001_init.sql`, which creates the tables, RLS policies, and the `get_post_for_reader` function.
4. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
   App runs at http://localhost:3000.

## Testing

```bash
npm run test:e2e       # headless run, starts the dev server automatically
npm run test:e2e:ui    # Playwright's interactive UI mode
```

Specs live in `tests/e2e/`:
- `auth.spec.ts` — signup, login, and the dashboard auth guard
- `publish-flow.spec.ts` — the core loop: create publication → write post → publish → read it publicly
- `paywall.spec.ts` — confirms a subscribers-only post is gated for an anonymous reader and readable after subscribing (this is the one that actually exercises the RLS/redaction logic, not just the UI)

Run these against a scratch Supabase project, not production data — the tests create real users and publications with randomized names/emails (see `tests/e2e/fixtures.ts`), and don't currently clean up after themselves.

## Claude Code

This repo includes `CLAUDE.md` (project conventions), `.claude/settings.json` (scoped permissions for the usual dev commands), and two project skills:
- `.claude/skills/supabase-rls/` — how to add/change tables and RLS policies here, including the redaction pattern used for the paywall
- `.claude/skills/playwright-e2e/` — test-writing conventions, test data helpers, and a flakiness-debugging checklist

These load automatically when a task matches their scope — no need to invoke them by name.

## What's next (Phase 2)

- Stripe Billing + Connect for paid tiers (schema already has `tier`/`stripe_subscription_id` columns on `subscriptions`, ready to wire up)
- Email delivery pipeline (queued sends via Trigger.dev/Inngest → Resend/Postmark) for "new post" notifications
- Custom/subdomain routing once path-based (`/p/:subdomain`) is outgrown
