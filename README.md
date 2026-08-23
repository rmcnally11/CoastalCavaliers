# coastalcavaliers.com

Static site. Netlify builds from `main` on every push — there is no build step,
Netlify just serves this folder.

**Local hands, open water.**

Bots: read `BOTS.md` first. GitHub is the file source of truth for this site
**and** the member app. n8n owns Airtable. Live catalog is GET `/webhook/cc-catalog`.

The member app is **on this domain** at `/app`. Do not 302 it to Grok, Vercel,
or any other host.

Waterdog Fuel is **on this domain** at `/fuel` until the name is ours. Separate company. Opening 2027.
Opening bases: Houston, Tampa, Fort Lauderdale. Pensacola on the board. Next: SC, GA, NC.
Bots: `ops/waterdog/README.md`. Do not take fuel money. Fuel forms POST `/.netlify/functions/waterdog` → n8n `wd-intake` → `WD_Operations`. Not the club Applications table.

---

## Structure

```
index.html          the marketing site
apply.html          standalone application page, for QR traffic
assets/
  css/site.css      marketing styles
  js/site.js        marketing behaviour, including the form handler
  img/*.webp        product and brand images
app/
  index.html        member app shell (PWA)
  app.js            catalog, box, cutoff, drop, lock, install
  app.css           app chrome
  catalog.json      labeled example only — not the live source
  manifest.json     Add to Home Screen
  sw.js             scoped to /app/
fuel/               Waterdog Fuel Co. site (separate company, same domain)
ops/waterdog/       Waterdog Airtable + n8n import pack — bots read README.md here
BOTS.md             contract for grok-bots / n8n — read this first
netlify.toml        headers, caching, redirects
sitemap.xml         regenerate if pages are added
robots.txt
```

## Deploying

Push to `main`. That is the whole process.

```bash
git add -A
git commit -m "what changed"
git push
```

Netlify picks it up within about a minute. Watch it at
app.netlify.com → the site → Deploys.

**Do not drag folders into Netlify any more.** Once the repo is connected,
a manual drop and a git push will fight each other and the next push will
silently overwrite whatever you dropped.

## The forms

Club forms — maker, marina, waitlist — POST to `/.netlify/functions/apply`,
which forwards to n8n `cc-apply`. Optional Netlify env: `N8N_APPLY_WEBHOOK`.
Waterdog forms POST to `/.netlify/functions/waterdog` → n8n `wd-intake` →
`WD_Operations` Leads / Newsletter. Optional: `N8N_WATERDOG_WEBHOOK`.
The live catalog is `/.netlify/functions/catalog` (TEST SKUs are stripped).

To roll back a bad publish: Netlify → Deploys → previous deploy → Publish.
Git still has every commit.

Each form carries a hidden honeypot field called `company_website`. A person
never sees it; a bot fills it. If it has a value the submit is dropped silently,
so the bot gets no signal that it failed. If you add a form, copy the
`<div class="hp">` block into it — the check is global and picks it up
automatically.

## Editing

* **Prices, copy, products** — index.html
* **Colours, layout, spacing** — assets/css/site.css
* **Zip codes served, webhook, form logic** — assets/js/site.js
  (the served zip list is the SERVED array near the top)
* **Images** — drop a .webp into assets/img/ and reference it relatively
* **Weekly catalog** — GET https://rjmrio.app.n8n.cloud/webhook/cc-catalog (`app/catalog.json` is a labeled example only)
* **Member app behaviour** — app/app.js

## Caching, so you are not surprised

`netlify.toml` caches `/assets/img/*` for a year and marks it immutable, while HTML
is never cached. CSS and JS revalidate. That means copy edits go live immediately, but
**if you change an image you must change its filename**, otherwise browsers will keep
serving the old one for up to a year.

## Colours

```
Gulf Sunrise  #EEC7BC     the brand colour
Logo Blue     #082952     headlines, dark grounds
Oyster        #F7F5F1     paper, warm off-white
Deep Gold     #966E22     the crest, rules, small caps
```

Full specification lives in the main project package.

## Notes for future you

**The member app is static on purpose.** This repo has no build step. Do not dump
a Vite/TanStack/Nitro project here. Edit `app/app.js` and `app/app.css`.

**sw.js at the root is a kill-switch, not a feature.** It caches nothing. It
exists to unregister a service worker that an earlier build wrongly registered
at the root, which took over the whole domain and served app files in place of
the homepage. Do not delete it — browsers holding the bad worker stay broken
until they fetch it. The member app’s worker is `/app/sw.js`, scoped to `/app/`.

**Check deploys in a private window.** No service worker there, so it shows what
Netlify is actually serving rather than what your browser cached.

## The webhook is in this repo

`assets/js/site.js` contains the n8n endpoint the forms post to. That is
unavoidable for a static site — the browser has to know where to send data, so
anyone can read it in view-source whether it is in a repo or not.

But a GitHub repo is more discoverable than a minified JS file. Bots scrape
public repos for endpoints. **Keep this repository private.** There is no
benefit to it being public, and Netlify connects to private repos exactly the
same way.

If it ever needs to be public, move the endpoint behind a Netlify Function so
the URL lives in an environment variable instead of the source.
