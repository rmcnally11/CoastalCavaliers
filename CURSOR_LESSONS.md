# Lessons for agents working in this repo

Read this before a sweep or a site edit. Append a new dated note when a later pass learns something the next agent would otherwise repeat.

## 2026-11-01 — weekly upkeep

- Pale gold `#E0CFA4` is for dark grounds (the soon bar, the Waterdog footer). On the Gulf Sunrise footer it fails contrast. The tagline there uses `--on-shell-gold`. Do not paint the Waterdog dark footer with the club footer colour.
- Files in `/assets/img/` are cached for a year and marked immutable. A smaller or replaced photo needs a new filename, or returning visitors keep the old file. The Slop Chest cards are a few hundred pixels wide; do not put 1600-pixel plates back on those `src`s.
- There is no `package.json` and no build step. Do not add a framework to test or “modernise” the site. `node --test test/*.test.js` covers the Netlify functions and local links, and those tests must not call the live webhooks. The member app is `app/` on this domain. There is no separate Keel app here. Leave other agents’ branches alone (open draft PR #39 is the live page check). The homepage catalog script looks for `#week-box`, which the current board removed on purpose. Do not wire that fetch back in during an upkeep pass.
