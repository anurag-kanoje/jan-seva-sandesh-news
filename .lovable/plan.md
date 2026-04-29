
## Goal
Stabilize email verification and authentication first, then harden the site for production with clearer roles, better publishing UX, stronger SEO, and missing monetization/content features.

## 1) Fix the auth + verification flow end to end
- Update auth flow so it behaves correctly on preview and published domains:
  - keep `onAuthStateChange` before `getSession()`
  - normalize redirects for signup verification and future password reset flows
  - avoid race conditions between `getSession`, role fetch, and route redirects
- Fix the signup/login pages so they do not redirect too early while auth state is still loading.
- Add a dedicated post-verification handling flow:
  - detect successful email confirmation session
  - show a clear Hindi success state
  - redirect verified users safely to `/dashboard` or `/login`
- Add better auth error mapping for:
  - unverified email
  - already registered
  - weak/pwned password
  - expired/invalid confirmation links
  - network/auth service failures
- Add forgot-password + reset-password flow so the auth system is complete, not just signup/login.

## 2) Fix the backend auth prerequisites that are currently incomplete
- Create a migration to restore the missing `on_auth_user_created` trigger, because the database currently has `handle_new_user()` but no trigger attached.
- Verify and harden profile creation so every new signup gets:
  - `profiles` row
  - safe default role behavior of `"user"` when no explicit role exists
- Review RLS compatibility so:
  - public users can access public pages
  - authenticated users can read/update their own profile
  - admins can manage roles
  - writers can create/edit only allowed articles
- Replace any client-only “admin utility” patterns that mutate production data directly from the browser with backend-safe operations where needed.

## 3) Clarify what you need to set up for email verification
### Works without extra setup
- Basic verification emails can work with the platform’s default auth email sender.
- If delivery is failing, the first code fix is to ensure correct redirect URLs and auth flow handling in the app.

### Optional setup you should do if you want branded/reliable production email
- Configure a sender email domain in the project email settings.
- Then set up branded auth email templates for:
  - signup verification
  - password reset
  - email change flows
- This is not required for basic auth to function, but it is the right production setup if you want professional delivery and branding.

## 4) Improve password UX and auth usability
- Refactor `PasswordField` with `forwardRef` to remove the current React ref warning and make it safer for reuse.
- Keep show/hide password.
- Keep password generator, but also improve the UX:
  - stronger helper text
  - live strength guidance
  - clearer Hindi hints for allowed format
  - better weak-password feedback before submission
- Add confirm-password on signup.
- Add “resend verification email” with cooldown and better messaging.

## 5) Fix role clarity and clean panel separation
- Make the role model explicit everywhere:
  - `admin` → full management panel
  - `writer` → article submission and own article management
  - `user` → basic profile panel only
- Fix existing panel mismatches:
  - `ProfilePage` currently falls back to writer layout for normal users; change it to true user layout
  - ensure dashboard routing is consistent and never loops
- Improve admin user management so admins can clearly assign/remove roles with clean labels in Hindi.

## 6) Strengthen article upload and publishing workflow
- Improve writer article form:
  - rich textarea/editor-ready structure
  - autosave draft behavior or at minimum unsaved-change protection
  - slug preview
  - excerpt helper text
  - category required/validated if desired
  - image upload errors and progress states improved
- Harden upload UX:
  - image preview sync when URL changes
  - better empty/error states
  - validate image dimensions/type/size clearly
- Improve writer article list:
  - preview published article
  - clearer status explanations
  - pagination if article count grows
- Improve admin moderation:
  - quicker approve/reject flow
  - search/filter by author/status/category
  - pagination for large content volumes

## 7) Close the biggest production gaps in SEO
- Expand `SEOHead` so it supports:
  - canonical URL
  - robots meta
  - Open Graph image/url/type
  - Twitter cards
  - site name
- Make metadata truly dynamic for:
  - homepage
  - article page
  - category page
  - search page
  - author pages
  - 404 page
- Add structured data:
  - `NewsArticle` schema on article pages
  - `Organization` schema on homepage/footer
  - `BreadcrumbList` where useful
- Fix sitemap + robots consistency:
  - robots should point to the correct public sitemap URL
  - sitemap should use the real site URL consistently, not derived fallback behavior only
- Improve internal linking:
  - related articles
  - author/category linking
  - better crawl paths for published content

## 8) Add missing production/business features
- Ads readiness:
  - add clean placeholders/slots for ads in article pages, homepage, and sidebar
  - make them optional and non-breaking
  - keep layout stable so ads can be enabled later without redesign
- Editorial quality features:
  - featured articles/hero highlight
  - breaking news management from admin
  - sticky/trending strategy based on approved content
- Trust features:
  - author bio block
  - publish/update timestamps
  - clearer contact/about/editorial info
- Analytics readiness:
  - keep RPC-based view counting
  - prepare event hooks for future analytics/ad conversion tracking without leaking secrets

## 9) Clean up current code issues discovered
- Remove the current React ref warning caused by `PasswordField`.
- Fix normal-user profile layout bug.
- Re-check that every public article query only serves approved articles.
- Review admin “slug backfill” flow and move it toward a safer production mechanism.
- Keep search capped at 200 chars and article validations in place.
- Recheck lazy loading, pagination, and no stray debug logs.

## 10) Final production verification pass
After implementation, verify:
- signup works
- verification email request succeeds
- confirmation link lands correctly on preview and published domain
- login works after verification
- session persists after refresh
- logout works
- no redirect loops
- admin/writer/user panels are clearly separated
- article upload works with image upload
- public users only see approved articles
- SEO tags render per page
- sitemap/robots are valid

## Technical changes
- Frontend files likely touched:
  - `src/hooks/useAuth.tsx`
  - `src/pages/Login.tsx`
  - `src/pages/Signup.tsx`
  - `src/pages/ProfilePage.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/components/ProtectedRoute.tsx`
  - `src/components/PasswordField.tsx`
  - `src/components/SEOHead.tsx`
  - `src/components/Header.tsx`
  - `src/pages/ArticlePage.tsx`
  - `src/pages/CategoryPage.tsx`
  - `src/pages/SearchPage.tsx`
  - `src/pages/writer/ArticleForm.tsx`
  - `src/pages/writer/WriterArticles.tsx`
  - `src/pages/admin/AdminArticles.tsx`
  - `src/pages/admin/AdminUsers.tsx`
  - `src/pages/admin/ProductionChecklist.tsx`
- Backend changes needed:
  - migration to recreate `on_auth_user_created` trigger
  - possible additional safe helper function(s) for admin-only maintenance tasks
  - email setup only if you want branded auth emails
- Important note:
  - the current signup request is succeeding and returns `confirmation_sent_at`, so the remaining verification problem is likely delivery/click-through/config flow, not raw signup failure alone.

## What I would implement next in order
1. Repair trigger + auth flow + verification handling
2. Add forgot/reset password
3. Fix role-panel separation
4. Refactor password field and signup UX
5. Improve article upload/moderation UX
6. Expand SEO + structured data + sitemap/robots consistency
7. Add ad-ready slots and final production polish
