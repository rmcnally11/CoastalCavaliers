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
