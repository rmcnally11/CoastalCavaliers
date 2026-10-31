# Live check

`check.sh` fetches the public Coastal Cavaliers pages and reports what a visitor would get. It does not edit HTML, CSS, JS, or Netlify config, and it does not deploy.

Requires bash and curl. No other dependencies.

## Run

```bash
ops/live-check/check.sh
ops/live-check/check.sh https://deploy-preview-NNN--coastalcavaliers.netlify.app
ops/live-check/check.sh --log --pr https://github.com/rmcnally11/CoastalCavaliers/pull/<number> --agent https://cursor.com/agents/<run>
```

The default base is `https://coastalcavaliers.com`. Pass a Netlify deploy-preview origin (no path, no trailing slash required) to check that build instead.

Exit 0 means every page passed. Any transport error, unexpected status, missing `<title>`, or honesty-rail violation exits non-zero.

## Pages

One path per HTML file Netlify serves. Derived from the HTML in this repo and the pretty URLs in `_redirects`.

| Path | File |
|---|---|
| `/` | `index.html` |
| `/waitlist` | `waitlist.html` |
| `/makers` | `makers.html` |
| `/marinas` | `marinas.html` |
| `/chest` | `chest.html` (the Slop Chest) |
| `/sport` | `sport.html` |
| `/app` | `app/index.html` |
| `/apply` | `apply.html` |
| `/privacy` | `privacy.html` |
| `/makers/portal` | `makers/portal/index.html` |
| `/fuel` | `fuel/index.html` |
| `/fuel/boats` | `fuel/boats.html` |
| `/fuel/marinas` | `fuel/marinas.html` |
| `/fuel/supply` | `fuel/supply.html` |
| `/fuel/contact` | `fuel/contact.html` |
| `/404` | `404.html` |

How it works is the homepage anchor `/#how`, not a page. There is no `/how-it-works` route. There is no `/slop-chest` route; the Slop Chest is `/chest`.

`/join` is the same file as `/waitlist`. It is not checked twice.

`sitepkg/` and `ops/` are forced 404s. Their HTML is not in this list. The old package under `sitepkg/` still contains "Ships in 2 weeks". If that copy is ever served on a public path, this check should fail.

`/404` is the not-found document. Netlify pretty URLs currently return it with status 200. The splat rule can also return status 404. Both are accepted. Any other status on `/404` fails. Every other path must return 200.

## What it prints

For each page: `PASS` or `FAIL`, the HTTP status, the path, and the `<title>`.

Then the asset version stamps it found:

- a build comment such as `html-20261006a`
- a stylesheet or script query such as `site.css?v=20261006a`

`stamps: none` is reported, not treated as a failure. Pages are hand-edited and do not all carry the same stamp.

## Honesty rail

These phrases fail the page, case-insensitive, as whole phrases:

- add to cart
- buy now
- checkout
- shopify
- ships in
- order now

Two existing honesty lines are not violations:

- `not taking orders` (including `not taking orders yet`)
- `no checkout` (including `no checkout on this site`)

`Nothing ships` does not match `ships in`. A word like `memberships in` does not match `ships in`.

## Log line

`--log` prints one markdown table row after the report:

```text
| 2026-10-31 | https://github.com/rmcnally11/CoastalCavaliers/pull/<number> | https://cursor.com/agents/<run> | pass |
```

Columns are the UTC date, the PR link, the agent link, and `pass` or `fail`. `--pr` and `--agent` set the links. `LIVE_CHECK_PR` and `LIVE_CHECK_AGENT` do the same when the flags are omitted. A missing link is `-`.
