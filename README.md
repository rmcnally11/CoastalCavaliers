# coastalcavaliers.com

Static site. Netlify builds from `main` on every push — there is no build step,
Netlify just serves this folder.

**Local hands, open water.**

---

## Structure

```
index.html          the site
apply.html          standalone application page, for QR traffic
assets/
  css/site.css      all styles
  js/site.js        all behaviour, including the form handler
  img/*.webp        product and brand images
app/                the ordering PWA (separate, self-contained)
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

All three — maker, marina, waitlist — POST to an n8n webhook:

```
https://rjmrio.app.n8n.cloud/webhook/cc-apply
```

That URL lives in one place, `assets/js/site.js`, near the top. It writes
straight into the Airtable Applications table.

Each form carries a hidden honeypot field called `company_website`. A person
never sees it; a bot fills it. If it has a value the submit is dropped silently,
so the bot gets no signal that it failed. If you add a form, copy the
`<div class="hp">` block into it — the check is global and picks it up
automatically.

## Editing

- **Prices, copy, products** — `index.html`
- **Colours, layout, spacing** — `assets/css/site.css`
- **Zip codes served, webhook, form logic** — `assets/js/site.js`
  (the served zip list is the `SERVED` array near the top)
- **Images** — drop a `.webp` into `assets/img/` and reference it relatively

## Caching, so you are not surprised

`netlify.toml` caches `/assets/*` for a year and marks it immutable, while HTML
is never cached. That means copy edits go live immediately, but **if you change
an image you must change its filename**, otherwise browsers will keep serving
the old one for up to a year.

## Colours

```
Gulf Sunrise  #EEC7BC     the brand colour
Logo Blue     #082952     headlines, dark grounds
Oyster        #F7F5F1     paper, warm off-white
Deep Gold     #966E22     the crest, rules, small caps
```

Full specification lives in the main project package.

## Notes for future you

**The app is a big file.** `app/index.html` is 713 KB because the ordering app
still has everything embedded, the way this site used to. Git stores the whole
file again on every commit that touches it. Fine at this size and frequency —
but if the app starts changing weekly, extract its assets the same way the
site's were extracted and the repo will stop growing.

**The root `icons/` folder was removed.** Nothing referenced it. The app keeps
its own copies at `app/icons/`.

**`sw.js` at the root is a kill-switch, not a feature.** It caches nothing. It
exists to unregister a service worker that an earlier build wrongly registered
at the root, which took over the whole domain and served app files in place of
the homepage. Do not delete it — browsers holding the bad worker stay broken
until they fetch it.

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
