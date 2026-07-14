Do I know what the issue is? Yes.

Root causes found

1. Cross-tab login is not a backend failure
- Recent backend auth error logs are empty, so this is not showing as rejected credentials or an auth server outage.
- The current problem is in browser/session synchronization.
- The app still announces login manually from `signIn()` before every browser tab can reliably read the saved session. On mobile, storage writes/events can be delayed or ignored while another tab is backgrounded, so the second tab can read `null` and remain logged out.

2. Cross-tab login has a browser limit you may be hitting
- Code can only sync login between tabs on the same exact website origin, in the same browser/profile.
- It cannot sync between the Lovable editor preview and the published site, preview URL and published URL, Chrome and Safari, normal and private mode, or Gmail/Facebook/Instagram in-app browsers.
- If your mobile test uses any of those combinations, you must log in separately there. No app code can force browsers to share auth storage across different origins/apps.

3. Article share preview is failing because article pages are client-rendered
- Clean article URLs are handled by React after the page loads.
- WhatsApp/Facebook/X crawlers usually read the static HTML first and do not wait for React to fetch the article and update metadata.
- Therefore the normal article URL can show the site/default preview instead of the article title unless a server-rendered preview URL is used.

4. The existing article URL itself is odd
- The approved article currently has a very long Hindi slug in the database.
- Even if the preview title is fixed, the visible shared URL will still look odd until that slug is changed to a short English SEO slug.

Fix plan

1. Fix same-origin mobile cross-tab auth sync
- Remove direct manual `SIGNED_IN` broadcasting from login.
- Make the auth state listener the only source that announces login/logout.
- After successful login, wait until the saved session is readable before navigating to dashboard.
- Replace the single delayed cross-tab check with a retrying hydration loop, because mobile tabs often need multiple attempts after storage events.
- Re-check session on `storage`, `BroadcastChannel`, `focus`, `visibilitychange`, `pageshow`, and `online` using the same hydration loop.
- Keep route protection waiting until auth and role checks are truly settled.

2. Fix article sharing behavior
- Use clean public article URLs for copy/native share.
- For WhatsApp/Facebook/X, send a title-first message and use the backend preview endpoint only where crawlers need server-rendered metadata.
- Keep preview metadata as article title only: title, description, Open Graph title/description, and Twitter title/description.
- Make crawler redirect/canonical point to the clean article URL.

3. Repair the existing article slug
- Change the current long Hindi slug to a short English slug such as `rte-private-schools-education-row`.
- Add a fallback so old shared Hindi links do not break immediately; they can still resolve to the same article or redirect to the new slug.

4. Validate before calling it fixed
- Verify backend auth logs still show no credential/backend errors.
- Verify the share preview response returns article-specific metadata.
- Verify generated share/copy URLs no longer expose odd technical URLs to normal users.
- State clearly which cases still require the user to log in manually because browsers do not share sessions across domains/apps.

After approval, I will implement only these fixes and then verify the signals above.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>