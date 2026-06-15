**Root causes found**

1. **Cross-tab login sync is racing storage updates**: the current `signIn()` broadcasts `SIGNED_IN` immediately after login returns. In other tabs, `syncFromStorage()` can run before the auth token is fully written/settled, so the other tab still reads `null` and stays logged out.
2. **Auth events are not the single source of truth**: the app broadcasts manually from login/logout functions instead of broadcasting only after the auth client confirms `SIGNED_IN` / `SIGNED_OUT` through `onAuthStateChange`.
3. **Social share link is weird by design right now**: `ShareActions.tsx` shares the backend function URL (`https://<project>.supabase.co/functions/v1/share/<slug>`) instead of the clean public article URL, so users see/share a technical-looking link.

**Fix plan**

1. **Refactor cross-tab auth sync in `src/hooks/useAuth.tsx`**
   - Make `onAuthStateChange` the only place that updates auth state and announces cross-tab changes.
   - Use a stable localStorage sync key like `jss-auth-sync` with `{ event, ts }` so every tab receives a reliable storage event.
   - Keep `BroadcastChannel` as a fast path, but add a small delayed re-check before reading the session to avoid the current race.
   - Remove the fragile `window.__jssAuthChannel` global and avoid broadcasting directly from `signIn()` / `signOut()`.
   - Ensure `loading` and `roleLoading` always settle after cross-tab sign-in, sign-out, visibility restore, and OAuth callback.

2. **Fix clean sharing URLs in `src/components/ShareActions.tsx`**
   - Use the published clean article URL (`https://jss-news-foundation.lovable.app/<slug>`) for WhatsApp, Facebook, X, native share, and copy link.
   - Stop exposing the backend function URL to real users.
   - Build URLs from the article slug instead of the current preview/admin origin so copied links are production-ready.

3. **Keep share preview support as safe fallback**
   - Leave the existing backend share function available for crawlers/testing, but do not use it as the user-facing link.
   - Ensure canonical/OG metadata continues to point to the clean article URL, not the backend function URL.

4. **Validate after implementation**
   - Check auth state transitions in code paths: tab A login -> tab B becomes logged in; tab A logout -> tab B becomes logged out.
   - Confirm share buttons generate clean URLs like `/rte-school-row`, not `/functions/v1/share/rte-school-row` or encoded Hindi URLs.