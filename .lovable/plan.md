# Goal
Make the site fully usable end-to-end: fix the blank page that appears after login, ensure every new signup gets a profile + default role, repair article joins so the homepage and category pages render, and polish the homepage news feed (category chips, featured story, pagination) so the site is publish-ready.

## Root causes found
1. **No DB triggers exist.** Despite earlier migrations, `handle_new_user` is not attached to `auth.users`, so signups never create a `profiles` row or a default `user_roles` row. Result: `useAuth` falls back to role `"user"`, `/dashboard` redirects to `/profile`, and `ProfilePage` calls `.single()` on a non-existent profile → silent crash → blank page.
2. **No foreign keys** on `articles.author_id` / `articles.category_id`. The PostgREST embed `profiles:author_id(full_name), categories:category_id(name)` returns `null` (or errors on some clients), making the homepage feed look empty.
3. Homepage already has chips + pagination, but lacks a real "featured story" treatment and graceful empty states; trending sidebar links use slug fallback that can 404.

## Changes

### 1. Database migration (fixes login + feed)
- Re-create trigger `on_auth_user_created` on `auth.users` → `public.handle_new_user()`.
- Extend `handle_new_user` to also insert a default `('user')` row into `user_roles` (ON CONFLICT DO NOTHING).
- Backfill: insert missing profiles and missing default `user` roles for every existing `auth.users` id.
- Add foreign keys:
  - `articles.author_id` → `profiles.user_id` (so `profiles:author_id(...)` embed works).
  - `articles.category_id` → `categories.id`.
- Add helpful indexes: `articles(status, created_at desc)`, `articles(category_id)`, `articles(author_id)`, `articles(slug)`.

### 2. Auth + routing hardening
- `ProfilePage`: switch `.single()` → `.maybeSingle()`, render even when the profile row is missing, and create one on first save.
- `useAuth`: keep current pattern; ensure `roleLoading` is always resolved (already OK) and that `signOut` redirects to `/`.
- `Dashboard`: if `role` is null after load, send to `/profile` instead of `/login` so the user is never stuck.
- Add an `ErrorBoundary` fallback message in Hindi instead of a blank screen.

### 3. Homepage news feed polish (`src/pages/Index.tsx`)
- Query approved articles with the now-working FK embed; show a real **Featured Story** (first article rendered large with overlay) + 6 secondary cards in a responsive grid.
- **Category chips** row already exists — make active category highlight and link directly to `/category/:id`.
- **Pagination** kept (10/page) with proper `totalPages` and disabled states; reset to page 1 when filters change.
- Empty/loading states with skeletons (already partially in place) and a clear "कोई समाचार नहीं" message.
- Trending sidebar: prefer `slug` only when present, otherwise `id`; add view counts.

### 4. Production-readiness checks (no behavior change unless broken)
- Verify `sitemap` edge function still builds with the new FKs.
- Confirm `robots.txt` points to production URL.
- Confirm category, author, article pages load for an anonymous visitor.

## Technical details
- Files touched: `src/pages/Index.tsx`, `src/pages/ProfilePage.tsx`, `src/pages/Dashboard.tsx`, `src/components/ErrorBoundary.tsx`, plus one new SQL migration.
- No changes to `src/integrations/supabase/client.ts` or `types.ts` (regenerated automatically after the migration).
- Email verification stays disabled (auto-confirm), per previous decision.

## Out of scope
- Custom email domain / branded templates.
- New monetization features beyond the existing `AdSlot` component.
