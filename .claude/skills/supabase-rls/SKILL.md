---
name: supabase-rls
description: Use whenever adding or changing a Supabase table, column, or Row Level Security policy in this repo — e.g. new post fields, new subscription tiers, new gated content types, or any task mentioning migrations, RLS, or paywall logic. Also use when debugging why a query returns fewer/more rows than expected for a given user.
---

# Supabase schema & RLS conventions (Inkwell)

This repo puts authorization in the database, not just the app. Follow these rules whenever touching `supabase/migrations/`.

## Migration files
- Never edit an already-applied migration. Create the next numbered file: `000N_description.sql`.
- A migration that adds a column used for access control (visibility, tier, status) must include its RLS policy changes in the *same* file — schema and policy drift is the most common bug class here.
- Every new table needs `alter table ... enable row level security;` immediately after creation. A table with RLS enabled and zero policies is fully locked — that's the safe default while you write policies, not a bug.

## The redaction pattern
Simple `select` RLS policies (row-level allow/deny) are not enough for partial-content gating — a policy can only allow or deny an entire row, but a locked post still needs its `title`/`excerpt` visible (for SEO and the paywall card) while `body` stays hidden.

For that, use a `security definer` function that:
1. Fetches the row with the definer's elevated privileges (bypassing RLS internally).
2. Computes entitlement explicitly (`exists (select 1 from subscriptions where ...)`).
3. Returns the row with the gated column swapped for `null` when not entitled, plus an `is_locked` boolean the frontend uses to render the paywall card.

See `get_post_for_reader()` in `0001_init.sql` as the reference implementation. Any new gated content type (e.g. a future "premium comments" feature) should follow the same shape rather than relying on the client to decide what to render.

## Testing a policy change
1. Write the migration.
2. `npm run db:push` against a scratch/local Supabase project.
3. In the SQL editor, use `set role authenticated; set request.jwt.claim.sub = '<test-user-uuid>';` to simulate a specific user and confirm the policy behaves as expected before trusting the app-level test.
4. Add or update a Playwright spec in `tests/e2e/` that exercises the new access boundary end-to-end (see the `playwright-e2e` skill) — a policy without a test for both the "should see" and "should not see" cases is incomplete.

## Common mistakes to avoid
- Using `using ()` for an `insert` policy — inserts need `with check ()`, `using ()` is silently ignored on insert.
- Forgetting `security definer set search_path = public` on a function that needs to read across RLS boundaries — without it the function runs as the caller and re-triggers the same restrictive policies you were trying to work around.
- Adding a new `visibility` or `tier` value without updating both the `check` constraint and every policy/function that enumerates the allowed values.
