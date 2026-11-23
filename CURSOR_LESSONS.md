# Lessons for agents working in this repo

Read this before a sweep or a site edit. Append a new dated note when a later pass learns something the next agent would otherwise repeat.

# Lessons for the next cloud agent

Read this before you edit. Checked against `main` (`3b6ac05`, 2 Nov 2026) and the live site where a status code is named.

## House rails

- No checkout, buy buttons, shipping, Shopify, or prices that read as live products. Do not invent makers or marinas.
- Pull request 7 (the Slop Chest preview cards) stays a draft. It was still an open draft on 2 Nov 2026. Do not mark it ready.
- `/sport` has no product wall. Leave that wall empty until signed shots exist. The page is a short hold: a hero and a waitlist door.
- `/app` is a hold-only stub. A lock stays on the phone. The app never takes a card. The website and the member app stay separate. Do not replace `app/index.html`.
- No Rio references.
- Write Coastal Cavaliers. Never CAV.
- Never use a bare ticket number. Name the change beside it.
- One pull request per change, and put the Netlify preview on it.
- Do not push `main`, deploy, force-push, or delete. Robert merges.
- `BOTS.md` and `README.md` still tell bots to push `main`. This file wins.

## Site facts

- Static HTML on Netlify. Publish directory is the repo root. There is no build step.
- Club forms go through `submitForm` in `assets/js/site.js`, which posts to `/.netlify/functions/apply`. Waterdog's own forms in `fuel/fuel.js` post to `/.netlify/functions/waterdog`. The waitlist door on the fuel homepage still calls `submitForm`, so that door uses the club function.
- How it works is the homepage anchor `/#how` (`id="how"` in `index.html`). It is not its own page.
- The Slop Chest is `/chest` (`chest.html`).
- `sitepkg/` and `ops/` are forced 404s. `_redirects` uses `404!`. `netlify.toml` sets `force = true`. Live `/sitepkg` and `/ops/zip-map/README.md` return 404.
- `sitepkg/index.html` still says `Ships in 2 weeks` next to dollar prices. It must never be served.
- `/404` returns status 200. Confirmed on the live site. `404.html` is a real file, and the catch-all in `_redirects` (`/* /404.html 404`) is not forced, so the file wins. A missing path still returns 404. Leave that catch-all unforced. A force mark on `/*` would send every real page to the 404.
- Stylesheets and scripts use `?v=` stamps. The stamp is not one site-wide value. Bump the stamp on each link you change. The Waterdog inner pages `fuel/boats.html`, `fuel/marinas.html`, `fuel/supply.html`, and `fuel/contact.html` link `/fuel/fuel.css` with no stamp. The fuel homepage link has one.
- The live check is `ops/live-check/check.sh`. That file is not on `main`. It is on draft pull request 39 (the live page check), branch `cursor/live-check-33c7`.
- The waitlist zip map reads `data/zips.json`. That file is on `main` (empty `zips` list, `updated` `2026-10-30`). `waitlist.html` fetches `/data/zips.json`. Refresh steps are in `ops/zip-map/README.md`, also on `main`.

## Working method

- Commit in small steps, then test.
- End every pull request with a Review section and a Lessons section.
- Report your crash count.
- Append new lessons to this file in that same pull request.

## Gotchas

- The honesty lines say `No checkout` and `No checkout on this site`. A scan for the bare word checkout fails those lines. They are the rail. Leave them. The waitlist line `We're not delivering yet and we're not taking orders` is the same kind of rail. Leave that sentence too.
- In bash, `${var: -N}` expands to an empty string when N is longer than the string. Checked on bash 5.2. When N equals the length, the expansion is the whole string. Test the length first, then use a positive offset.

## Lessons

- This file is not in the `_redirects` hide list. `BOTS.md` and `GITHUB_NETLIFY_SETUP.txt` are. A request for this file can return 200, because the catch-all is not forced. Leave the redirects alone unless Robert asks.

## 2026-11-01 — weekly upkeep

- Pale gold `#E0CFA4` is for dark grounds (the soon bar, the Waterdog footer). On the Gulf Sunrise footer it fails contrast. The tagline there uses `--on-shell-gold`. Do not paint the Waterdog dark footer with the club footer colour.
- Files in `/assets/img/` are cached for a year and marked immutable. A smaller or replaced photo needs a new filename, or returning visitors keep the old file. The Slop Chest cards are a few hundred pixels wide; do not put 1600-pixel plates back on those `src`s.
- There is no `package.json` and no build step. Do not add a framework to test or “modernise” the site. `node --test test/*.test.js` covers the Netlify functions and local links, and those tests must not call the live webhooks. The member app is `app/` on this domain. There is no separate Keel app here. Leave other agents’ branches alone (open draft PR #39 is the live page check). The homepage catalog script looks for `#week-box`, which the current board removed on purpose. Do not wire that fetch back in during an upkeep pass.

## 2026-11-10 — root notes and the fuel stamp

- Live `/CURSOR_LESSONS.md`, `/BOTS.md`, `/GITHUB_NETLIFY_SETUP.txt`, and `/README.md` returned 200. Those four are internal notes in the publish root. A soft 404 does not hide a file that exists. `_redirects` now uses `404!` for them, and `netlify.toml` sets `force = true`. `/robots.txt` returned 200 and stays, because it is the public crawler file. Notes under `ops/` and `sitepkg/` were already forced 404s.
- The sentence above, that this file is not in the hide list and to leave the redirects alone unless Robert asks, is the state before this hide.
- The Waterdog inner pages `fuel/boats.html`, `fuel/marinas.html`, `fuel/supply.html`, and `fuel/contact.html` now link `/fuel/fuel.css?v=20261101a`, the same stamp as the fuel homepage. That landed in `d6b955c`. The "no stamp" sentence above is the state before that commit.

## 2026-11-12 — three fields, then the boat

- The homepage and `/waitlist` join with name, email, and zip. City, marina, boat, plan, and the Slop Chest box are an optional second step on the thank-you. Skipping that step still leaves the person on the list.
- Both posts go through `submitForm` in `assets/js/site.js` to `/.netlify/functions/apply`. That function only forwards the body. It cannot patch an Airtable row. The same signup is tied by a client UUID in the existing `notes` field, written as `Application: <uuid>`. No new contract key, no new secret, no second webhook.
- n8n `CC_WF2_Applications_v4_CORS` (webhook `cc-apply`) still inserts a row per post until it upserts on that token. Do not change that workflow from this repo. The exact match is in the pull request.
- `apply.html` has no `#wait-boat`, so it still sends every waitlist field in one post and does not mint an Application token. Door bands and the Boat Snacks popup do not either.
- A plan card's "I have X in mind" only pre-selects the step-two plan. It is stored when they save step two. The card copy stayed word for word.
- FAQ and the host-marina lines were left as written. The rails "No checkout" and "No checkout on this site" stay. The line under the three-field button is "Free. No card. Nothing ships."
- `ops/live-check/check.sh` is on `main` (pull request 39 merged). The sentence above, that the script is only on the draft branch, is the state before that merge.

## 2026-11-13 — intake on the main n8n account

- `/.netlify/functions/apply` posts to `https://rmc11.app.n8n.cloud/webhook/cc-apply` (`CC_WF2_Applications_v5_rmc11`, id `EJuHsYalrBailiqs`); the old account's workflow is left as it was, and the v4 insert sentence above is the state before this move.

## 2026-11-14 — rendered lines, and the makers headline

- Match a handoff sentence across inline markup and across the makers hero's two lines. The makers H1 is not a `<br>`. It is two `.h1-line` spans, the second inside `<em>`, and `.h1-line` is `white-space:nowrap`. A `<b>` on a deal bullet or the apply pitch is the same kind of split. Keep the bold on the lead phrase when that phrase still opens the replacement.
- The makers page forces that title to `clamp(40px, 6.5vw, 84px) !important`, so a 390px window stays at 40px. "Not signing kitchens yet." in Fraunces 600 italic is about 411px wide. The line box is 350px, and the glyphs run past the viewport. That headline stayed "Zero fees." / "Friday pay." Do not drop `nowrap` or the size clamp to force a longer line in.
- Body copy in `waitlist.html` writes the em dash as `&mdash;`. That is the same character as a typed em dash.
- Page stamps are the footer comments (`waitlist-`, `makers-`, `apply-`, `html-`). Bump the comment on a page whose copy changed. Leave the `?v=` on a stylesheet or script alone when that file did not change.

## 2026-11-14 — the short makers line fits

- "Not signing yet." in Fraunces 600 italic at 40px, with the hero's letter-spacing of -0.03em, is 260.56px wide. The 390px content box is 350px, so that second line fits with both spans still `nowrap` and the size clamp left alone. "Not signing kitchens yet." is still about 411px and still runs past the box. The makers H1 is now "Zero fees." / "Not signing yet." The sentence above, that the headline stayed "Friday pay.", is the state before this change.
- A `.h1-line` is `display:block`, so its box width is the content box, not the glyphs. Measure the text with a range. On the deploy preview at 390px, "Zero fees." is 170.47px and "Not signing yet." is 260.56px. At 1280px the type is 83.2px, and those lines are 304.89px and 470.39px.
- The makers Open Graph title, Twitter title, and FAQ JSON-LD do not contain the phrase "Friday pay". Leave them when the headline changes. The portal kick "Friday pay" and the unpublished `sitepkg` line are not this H1.
- `ops/live-check/check.sh` prints `?v=` stamps. It does not print the footer build comment, so a makers copy change can pass while `/makers` still shows the older stylesheet stamp.

## 2026-11-14 — logo width and height

- Club header logos display at 42×42 and footers at 46×46. Fuel header and footer logos display at 48×48. CSS sets both sides and `object-fit:contain`. The width and height attributes match that box. The files are not square: crest 339×330, wordmark 360×350, leaping dog 334×296, dog and anchor 339×292.
- The fuel hero leaping dog is CSS width 220px and `height:auto` (160px below 800px). Attributes 220×195 keep the 334×296 ratio, because 220 × 296/334 rounds to 195. `fuel.css` already sets `height:auto`, so the painted height stays the file's ratio.
- The sport mark is `width:100%` and `max-width:340px`, and `site.css` sets no height. A height attribute alone is a fixed pixel height, so under that cap the mark stretches. `height:auto` on `.mark-clear` keeps the current scale. Attributes 340×293 are the cap times 292/339, rounded. Leave that `height:auto` in place.
- Do not add `loading=lazy` to a header logo. An attribute-only edit does not change copy, so leave the `?v=` stamps and the footer build comments alone.
- `waitlist.html`, `makers.html`, and `apply.html` still have the same bare logo images. Do those in a later pull request.

## 2026-11-14 — the three doors, and one delivery string

- The sentence above, that those three pages still have bare logo images, is the state before this follow-up. Their headers are now 42×42 and their footers are 46×46, the same boxes as the other club pages. On `makers.html` that is the only change. The H1 stays "Zero fees." / "Not signing yet." and the footer comment stays `makers-20261114b`.
- `/apply` and `/makers` both post `deliveryPref` from the `#m_delivery` select. `val()` in `assets/js/site.js` copies the option text. Nothing in that file compares it to "I can deliver". The shared option is "I can bring them". The apply label is the makers label, word for word: "Can you get goods to us, or should we pick up?"
- The apply footer comment is `apply-20261114b` because that label and option are copy. The `?v=` on `site.js` stayed, because the script did not change. Do not post a form to check this. `sitepkg/` still says "I can deliver" and must stay unpublished.

## 2026-11-20 — pretty paths were unlinked

- `/makers`, `/marinas`, `/apply`, `/chest`, `/privacy`, and `/waitlist` are 200 rewrites to the `.html` files. A link to `/makers.html` is a different URL from `/makers`. Before this pass those six pretty paths had no inbound link from any page. The sitemap and the canonical tags use the pretty paths.
- The shared footer is the club footer: `.also` ("Also from us") plus `.fgrid`. Waterdog pages and `makers/portal/index.html` use other footers. `/sport` was left unchanged, so its footer still uses the `.html` hrefs. `/app` was left unchanged.
- Makers, marinas, apply, and waitlist mark the current page with `aria-current="page"`. Chest and privacy omit a self-link. Match that. Do not add a second copy of a label the footer already has. Privacy already linked Waitlist in the club column, so the new Also row does not repeat it; that column link now points at `/waitlist`.
- The apply page's own footer and nav say Apply. The H1 is Partner. Do not invent the link text "Partner/Apply".
- An href-only edit does not change copy. Leave the `?v=` stamps and the footer build comments alone. Header and body links on these pages still use `.html`. Those files return 200. Do not retarget them in a pass that was told not to change copy.

## 2026-11-23 — ink links on /fuel

- `a { color: var(--gold) }` is `#8C6A24`. That clears AA on oyster. On `section.ink` (`#082952`) it is 2.90:1. `a:hover { color: var(--ink) }` is not overridden inside `.ink`, so the hover is ink on ink, 1.00:1. `.ink a` is now `--gold-lt` (`#E0CFA4`, 9.40:1) and `.ink a:hover` is `--bg` (`#F7F5F1`, 13.31:1).
- `.btn.gold` is two classes, so it still beats `.ink a`. The "Talk to us" button in that band stays white on gold. Do not paint it pale gold: `#E0CFA4` on `#8C6A24` is 3.24:1.
- The only text links inside `.ink` are "Market updates" and "Gasoline and distillate" on `/fuel/`. The marinas ink band has no links.
- `/fuel/fuel.css` is outside the `/assets/css/*` must-revalidate header. The five fuel pages share one `?v=` stamp. Bump all five when the sheet changes. The `20261101a` stamp in the 10 Nov note is the state before this change. The stamp is now `20261123a`.

## 2026-11-23 — the zip check does not vote

- `checkZip()` in `assets/js/site.js` only paints `#zipres`. It does not post. The out-of-area line must not say the zip already counted. The line is now "Not first-wave yet." plus "Add your name" and "your zip counts as a vote for the next water." "Add your name" uses the same `zip-go` anchor and color as the in-area link, and its href is `/waitlist`. The in-area sentence stayed word for word.
- A click on `.zip-go` still runs `preventDefault` and `reservePlan`. On the homepage that scrolls to the on-page list and fills the zip. The href is what a new tab, or a browser with that handler absent, follows.
- The sentence "Your zip is a vote" was not in `index.html`. Two nearby lines were left. The homepage `.zipnote` still says "Any other zip is a vote for the next water we open." The apply Waitlist pitch still says "Leave your place on the list. Your zip is a vote for the next water." That pitch sits on a form that posts. `sitepkg/` has its own checker and was left unpublished.
- `site.js?v=` is `20261123a` on every page that loads the script except `fuel/index.html`. This pass was told not to touch `/fuel`, so that page still requests `?v=20261101a`. The footer build comments stayed, because the page copy did not change.
- Do not add a beacon, a counter, or a post to make the old sentence true.

## 2026-11-23 — the homepage zip note counts after they join

- The sentence above, that the homepage `.zipnote` still says "Any other zip is a vote for the next water we open.", is the state before this follow-up. That note sits on the checker, and the checker does not post. It now keeps "Optional — first-wave zips hear first." and then "Add your name and any other zip counts as a vote for the next water we open."
- The homepage footer comment moved to `html-20261123a` because that note is page copy. The `?v=` on `site.js` stayed `20261123a`.
- The apply Waitlist pitch still says "Your zip is a vote for the next water." That form posts. Leave it.
- `waitlist.html` still says "Any other zip is a vote for the next water" in the lede, the map caption, and one FAQ answer. This pass was the homepage `.zipnote` only.

## 2026-11-23 — a catalog 404 is not an empty week

- `netlify/functions/catalog.js` still returns status 200, the note `No live lines this week.`, `cluster: {}`, and `products: []` when `fetch` throws or the upstream status is not OK. A quiet week from a healthy webhook can look the same. `ok` is `false` on the catch path and `true` after a parsed body. `console.error` prints the error message. A non-OK status is thrown as `catalog upstream ` plus that status, so a 404 is in the function log.
- Leave the note text, the 200, the TEST SKU filter, the CORS headers, the success `Cache-Control`, and `N8N_CATALOG_WEBHOOK` (default `https://rjmrio.app.n8n.cloud/webhook/cc-catalog`). Do not retarget the webhook from this repo, and do not change n8n or Airtable to paper over the 404.
- `app/app.js` checks the HTTP status, then copies the JSON when `products` is an array. It does not read `data.ok`. An outage is still an empty board in the app. Leave `app/` alone. The homepage script still returns when `#week-box` is missing.
- `test/functions.test.js` still only checks that a failure has an empty `products` list. Those two cases now print the error line. `test/catalog-fallback.test.js` is the test that asserts `ok`.
