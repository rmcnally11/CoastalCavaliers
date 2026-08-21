# Bot contract — Coastal Cavaliers

One club. Two surfaces. **Same domain.**

Authoritative package: Drive folder `00 CURRENT — Coastal Cavaliers package (v16.1)`.

| Surface | Job | File source of truth | Deploy |
|---|---|---|---|
| **Website** | Marketing, waitlist, maker/marina applications, Slop Chest preview | GitHub `rmcnally11/CoastalCavaliers` | Netlify ← `main` |
| **Member app** | Catalog, box, cutoff, drop, last-box reorder, home-screen install | GitHub `app/` in the same repo | Netlify serves `https://coastalcavaliers.com/app` |
| **Operations** | Applications, orders, members, POs | Airtable `CC_Operations` | n8n is the only writer |

**Do not send `/app` to a Grok, Vercel, or other side URL.** Robert reversed that on 2026-08-21. The member app is part of coastalcavaliers.com. Bots update it by pushing files in `app/` to this repo.

## Roles

| Bot | Job | Must not |
|---|---|---|
| **Heavy / any Grok bot** | Keep the member app working **in this repo** at `app/`. Edit `app/index.html`, `app/app.js`, `app/app.css`, `app/manifest.json`, `app/sw.js`. Push to `main`. Netlify publishes to coastalcavaliers.com/app. | 302 `/app` off-site. Dump a TanStack/Vite/Nitro build into this static repo. Invent `/webhook/cc-order`. Change the homepage header. |
| **Commodore** | Keep `_redirects` serving `/app` as `/app/index.html` (200). Keep `app/catalog.json` on this site (file shadowing). | Point Get the app at grok.me / vercel.app / any other host. |

## GitHub (`rmcnally11/CoastalCavaliers`)

Static HTML. Push to `main` and Netlify serves it. That is how bots update **the club site and the member app**.

### You may

- Edit copy in `index.html`, `makers.html`, `marinas.html`, `apply.html`, `waitlist.html`, `sport.html`, `waterdog.html`
- Edit the member app in `app/` (`index.html`, `app.js`, `app.css`, `manifest.json`, `sw.js`)
- Add real brand plates to `assets/img/` (change the filename if replacing a cached image)
- Overwrite **`app/catalog.json`** (WF0). This is the catalog the member app reads.
- Keep the apply webhook in `assets/js/site.js` as `https://rjmrio.app.n8n.cloud/webhook/cc-apply`

### You must not

- 302 `/app` to grok.me, vercel.app, or any host other than coastalcavaliers.com
- Hide the app in the footer only. Header CTA stays **Check your water**. The Gulf Sunrise rail is **Join the club** + **Get the app** — keep both, both on this domain.
- Collapse the marketing homepage and the member app into one page
- Invent makers, baker profiles, food photography, or heraldry
- Take money. Stripe lives on the website later. The app holds only.
- Invent `/webhook/cc-order`. Holds are WF1-shaped. Do not invent a second n8n URL.
- Dump a Node/Vite/TanStack build here. This repo has **no build step**. The app is static HTML/CSS/JS.

### `_redirects` for the app

```
/app/box          /app/index.html  200
/app/catalog      /app/index.html  200
/app/drop         /app/index.html  200
/app/last         /app/index.html  200
/app/install      /app/index.html  200
/app              /app/index.html  200
/app/             /app/index.html  200
```

Existing files (`app/catalog.json`, `app/app.js`, `app/app.css`, icons, sw, manifest) shadow those rewrites and stay on this site.

## Catalog

`app/catalog.json` in this GitHub repo is the file WF0 overwrites.

- Live URL: `https://coastalcavaliers.com/app/catalog.json`
- Example box only until a live manifest exists. No photographs. Maker is `Example` or `Cavaliers Galley`.

When WF0 commits a new catalog to GitHub, Netlify publishes it and the member app fetches that file.

## Data (not GitHub)

| Event | Path |
|---|---|
| Site waitlist / maker / marina | POST `https://rjmrio.app.n8n.cloud/webhook/cc-apply` (WF2, source = Site) |
| App hold | Browser localStorage, WF1-shaped payload. App never bills. |
| Cycle | America/Chicago, Wednesday-noon cutoff, Saturday delivery, cluster `CL-01` |

n8n writes Airtable. GitHub does not.

## Branding (do not freelance)

From `CC_Colourways.txt` only:

- Gulf Sunrise `#EEC7BC`
- Logo Blue `#082952`
- Oyster `#F7F5F1` — never pure white
- Deep Gold `#966E22`
- Coral `#D2622A` — warnings; children’s apparel exception

Fonts: Fraunces + Archivo.

Marks always with the wordmark: crest + sabres (club), dog-and-anchor (Cavaliers Sport), leaping dog (Waterdog).

Copy: “Local hands, open water.” “Made ashore. Enjoyed aboard.”

Founding burgee is **$120**, numbered 1–100. HARBOUR is **$45**. Launch sequence is merch → Galley/HARBOUR → club.

## App Store

The member app is a PWA on coastalcavaliers.com/app (Add to Home Screen). A native App Store / Play Store listing is a later wrap of **this same app**, not a new website. Do not stand up a side domain for it.
