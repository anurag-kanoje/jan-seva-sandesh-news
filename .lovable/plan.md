## Goal
Skip email verification (auto-confirm signups) and ship the next batch of production features: correct sitemap/robots, an admin moderation queue, polished category and author pages, and an upgraded writer/admin article editor.

## 1. Disable email verification (skip-for-now mode)
- Configure Lovable Cloud auth to auto-confirm new signups so users can sign in immediately after signing up. No verification email is required.
- Update Signup page:
  - Remove the "verification pending" UI and resend button.
  - On success, show "खाता बन गया, अब लॉगिन करें" and redirect to `/login` (or auto-redirect to `/dashboard` when a session is returned).
- Update Login page:
  - Remove "unverified email" handling and "resend verification" prompts.
  - Keep forgot password link and clean Hindi error messages.
- Keep `useAuth.signUp` returning `{ error, needsVerification }`, but `needsVerification` will effectively always be false now.
- Note: forgot/reset password still uses email. That is a separate flow and not affected by disabling signup verification.

## 2. Fix sitemap and robots for production
- `public/robots.txt`:
  - Set `Sitemap:` to `https://jss-news-foundation.lovable.app/sitemap.xml`.
  - Allow all, disallow `/admin`, `/writer`, `/dashboard`, `/profile`, `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- `supabase/functions/sitemap/index.ts`:
  - Default `siteUrl` to `https://jss-news-foundation.lovable.app` (overridable via `SITE_URL` secret if ever needed).
  - Include: `/`, all category pages, all approved articles, all writer/admin author pages.
  - Use proper `<lastmod>` ISO dates.
  - Add a homepage entry plus a static `/search` entry.
- Add a thin Vite redirect or short note: the public sitemap path should be `https://jss-news-foundation.lovable.app/sitemap.xml`. Since hosting can't proxy to the function, robots.txt will instead point directly to the deployed function URL `https://qltedcfuztowideidlrh.supabase.co/functions/v1/sitemap` AND we will also expose a static `public/sitemap.xml` placeholder pointing crawlers to the live function.
  - Final approach: `robots.txt` points to the function URL (already crawlable), and the sitemap function emits absolute production URLs.

## 3. Admin moderation queue upgrade
Upgrade `src/pages/admin/AdminArticles.tsx`:
- Server-side search by title (`ilike`).
- Filters: status (all/pending/approved/rejected) and category (dropdown from categories table).
- Pagination (10/page) using `range()` + `count: 'exact'`.
- Bulk selection with checkboxes; bulk Approve/Reject/Delete actions.
- Keep individual row actions: view, approve, reject, delete.
- Author and category names rendered safely; clickable author link to `/author/:id`.
- Default landing tab: `pending` so moderators see the queue first.
- Loading skeletons and empty state in Hindi.

## 4. Category listing pages
`src/pages/CategoryPage.tsx` already filters approved articles and paginates. Enhancements:
- Dynamic SEO title/description per category via `SEOHead` (canonical URL, OpenGraph).
- JSON-LD `CollectionPage` schema listing the page's article URLs.
- Breadcrumb links: Home › श्रेणी › {category name}.
- Internal cross-links to other categories at the bottom (chip row).
- Show "0 लेख" empty state with link back to homepage.

## 5. Author pages
`src/pages/AuthorPage.tsx` enhancements:
- Author bio block at top: avatar (fallback icon), full name, bio text, and small stat row (total approved articles).
- Pull `bio`, `avatar_url` from `profiles` table (add columns via migration).
- Dynamic SEO: title `{name} - लेखक - जन सेवा संदेश`, description from bio, canonical URL, OG tags.
- JSON-LD `Person` schema with `name`, `url`, `image`, plus a `CollectionPage` of articles.
- Breadcrumbs: Home › लेखक › {name}.
- Link author name from article cards to this page (already partly wired).

## 6. Writer/Admin article editor upgrade
Upgrade `src/pages/writer/ArticleForm.tsx`:
- Live slug preview shown under title; editable for admins, read-only for writers.
- Autosave to localStorage (key per draft id or `new`) every few seconds; restore on reopen with a "Draft restored" toast and a "Discard draft" button.
- Unsaved changes guard via `beforeunload` and route navigation prompt.
- Dirty tracking to enable/disable Save button.
- Improved `ImageUpload` UX:
  - Real upload progress (use XHR-style progress where possible; fallback to staged progress).
  - Clear error states for type/size/network errors.
  - Replace/remove buttons; show file name and size.
- Validation messages inline (not just toast) and required-field highlighting.
- After save: clear localStorage draft.

## 7. Database changes
Migration to:
- Add `bio text default ''`, `avatar_url text`, `social_links jsonb default '{}'::jsonb` to `profiles`.
- Restore the `on_auth_user_created` trigger calling `handle_new_user()` so every signup still gets a profile row even with auto-confirm.
- Backfill missing profiles for any existing auth users.

No FK changes attempted in this batch (the public listings already join via embedded selects and work).

## 8. Files touched
- `src/pages/Signup.tsx`, `src/pages/Login.tsx`, `src/hooks/useAuth.tsx`
- `public/robots.txt`, `supabase/functions/sitemap/index.ts`
- `src/pages/admin/AdminArticles.tsx`
- `src/pages/CategoryPage.tsx`, `src/pages/AuthorPage.tsx`
- `src/pages/writer/ArticleForm.tsx`, `src/components/ImageUpload.tsx`
- New: `src/components/Breadcrumbs.tsx`, `src/hooks/useAutosave.ts`
- New migration for profile columns + trigger restore

## What you do not need to do
- No DNS, no email setup. Verification is disabled.
- Lovable Cloud auth setting will be flipped automatically.