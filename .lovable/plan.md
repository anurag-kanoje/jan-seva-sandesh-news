# Fix priorities (in order)

## 1. Cross-tab login/logout sync (highest priority)

**Problem:** When you sign in or out in one tab, other open tabs don't update. The current `storage` listener exists but Supabase's own broadcast can miss sign-out, and we don't force a state refresh on visibility change.

**Fix in `src/hooks/useAuth.tsx`:**
- Match the actual Supabase storage key (`sb-<project-ref>-auth-token`) — current code checks `supabase.auth.token` which is the v1 key and never fires.
- Add a `BroadcastChannel('jss-auth')` that posts `SIGNED_IN` / `SIGNED_OUT` events from `signIn`, `signInWithGoogle`, and `signOut`, and listens in every tab to re-run `supabase.auth.getSession()`.
- Add a `visibilitychange` listener: when a tab becomes visible again, re-check the session so a tab that was backgrounded during a logout updates immediately.
- On `SIGNED_OUT` event (from listener or broadcast), clear `user`/`role` synchronously so protected routes redirect without a reload.

## 2. Ads not appearing on home page + "Failed to fetch" in admin

**Root cause #1 — slot name mismatch:**
- Admin `AdminAds.tsx` SLOTS list: `home-top`, `home-mid`, `home-sidebar`, `article-top`, `article-bottom`, `category-top`.
- `Index.tsx` actually renders: `home-feed-top` and `home-sidebar`.
- Result: any ad you create for "home-top" is never queried, so it never displays.

**Fix:**
- Align the slot identifiers. Rename `home-feed-top` → `home-top` in `Index.tsx`, add a `home-mid` slot between feed sections, and add a `category-top` `AdSlot` to `CategoryPage.tsx`.
- Keep the admin SLOTS list as the single source of truth and reuse it via a shared constant (`src/lib/ad-slots.ts`) so this can't drift again.

**Root cause #2 — "TypeError: Failed to fetch" on admin Ads page:**
- The page runs `supabase.rpc("get_ad_stats")` in parallel with the ads select. If `get_ad_stats` ever errors (network blip, cold edge, or unauthenticated call before auth hydrates), the `Promise.all` rejects and the whole load fails with `TypeError: Failed to fetch`, leaving the page broken.
- Also, `load()` runs on mount before `useAuth` confirms the admin session, so the RPC can fire without a valid JWT.

**Fix:**
- Gate `load()` behind `user && role === 'admin'` (wait for `useAuth` to hydrate).
- Replace `Promise.all` with two independent awaited calls wrapped in try/catch so an ads-stats failure still renders the ad list (stats default to 0).
- Surface a non-blocking toast if stats fail instead of the whole page error.

**AdSlot query robustness:**
- The chained `.or("starts_at.is.null,starts_at.lte.…").or("ends_at.is.null,ends_at.gte.…")` is correct PostgREST, but if the network call rejects we silently render nothing. Add a try/catch and console.warn so admins can debug missing ads.

## 3. Harden slug generation

**In `supabase/functions/generate-slug/index.ts`:**
- Validate the AI response: must match `/^[a-z0-9-]{2,60}$/`, not be a reserved route (`article`, `category`, `login`, etc.), and not collide. Retry the AI call up to 2 times if it returns junk before falling back to `fallbackSlug`.
- Always run a final uniqueness loop and return both `slug` and `wasFallback: boolean`.

**In `src/pages/writer/ArticleForm.tsx`:**
- On **edit**, never regenerate the slug. Only generate a slug when creating new, OR when the existing article has no slug (legacy rows). Show the current slug read-only on the edit form so writers see the permanent URL.
- After calling `generate-slug`, re-check uniqueness client-side via a `select id from articles where slug=? and id<>?` query; if a duplicate sneaks in, append a 4-char random suffix and retry once.
- If the user truly wants to change a slug, that becomes an explicit admin-only action (out of scope for this pass — note only).

## Files touched

```text
src/hooks/useAuth.tsx                  cross-tab sync via BroadcastChannel + correct storage key + visibility refresh
src/lib/ad-slots.ts                    new — shared SLOTS constant
src/pages/admin/AdminAds.tsx           use shared SLOTS, gate load on auth, split stats from ads, error tolerant
src/pages/Index.tsx                    rename slot to home-top, add home-mid
src/pages/CategoryPage.tsx             add category-top AdSlot
src/components/AdSlot.tsx              try/catch + warn on fetch failure
supabase/functions/generate-slug/...   stricter validation, retry, reserved-slug blocklist
src/pages/writer/ArticleForm.tsx       no slug regeneration on edit, client-side uniqueness retry
```

No database migration needed.

## Verification

- Open the app in two tabs; log out in one → other tab redirects to login within a second.
- Create an ad targeted at "होम पेज - ऊपर" → appears at top of home feed.
- Visit `/admin/ads` from a fresh session → page loads even if stats RPC is slow; impressions/clicks display once they arrive.
- Edit an existing article and save → slug in URL is unchanged.
- Submit a new article with a duplicate-likely title twice → both resolve to unique slugs.
