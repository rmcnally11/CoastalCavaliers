# Bot contract — Coastal Cavaliers

One club. Two surfaces. **Same domain.** Waterdog Fuel is a **third** surface: a separate company, served from this same repo at `/fuel` until the Waterdog domain exists.

Authoritative package: Drive folder `00 CURRENT — Coastal Cavaliers package (v16.1)`.

| Surface | Job | File source of truth | Deploy |
|---|---|---|---|
| **Website** | Marketing, waitlist, maker/marina applications, Slop Chest preview | GitHub `rmcnally11/CoastalCavaliers` | Netlify ← `main` |
| **Member app** | Catalog, box, cutoff, drop, last-box reorder, home-screen install | GitHub `app/` in the same repo | Netlify serves `https://coastalcavaliers.com/app` |
| **Waterdog Fuel** | Rack-to-dock / wet-hose site. Opening 2027. Not taking fuel money. | GitHub `fuel/` | Netlify serves `https://coastalcavaliers.com/fuel` |
| **Operations** | Applications, orders, members, POs | Airtable `CC_Operations` | n8n is the only writer |
| **Waterdog ops** | Leads, quotes, invoices, tickets, hosts | `ops/waterdog/` (schema + n8n import). Live names land in `CC_Operations` → Applications until `WD_Operations` exists. | n8n is the only writer |

**Do not send `/app` to a Grok, Vercel, or other side URL.** Robert reversed that on 2026-08-21. The member app is part of coastalcavaliers.com. Bots update it by pushing files in `app/` to this repo.

## Roles

| Bot | Job | Must not |
|---|---|---|
| **Heavy / any Grok bot** | Keep the member app working **in this repo** at `app/`. Edit `app/index.html`, `app/app.js`, `app/app.css`, `app/manifest.json`, `app/sw.js`. Push to `main`. Netlify publishes to coastalcavaliers.com/app. | 302 `/app` off-site. Dump a TanStack/Vite/Nitro build into this static repo. Invent `/webhook/cc-order`. Change the homepage header. |
| **Commodore** | Keep `_redirects` serving `/app` as `/app/index.html` (200). Keep `app/catalog.json` on this site (file shadowing). | Point Get the app at grok.me / vercel.app / any other host. |

## GitHub (`rmcnally11/CoastalCavaliers`)

Static HTML. Push to `main` and Netlify serves it. That is how bots update **the club site, the member app, and Waterdog Fuel**.

### You may

- Edit copy in `index.html`, `makers.html`, `marinas.html`, `apply.html`, `waitlist.html`, `sport.html`, `waterdog.html`
- Edit the Waterdog Fuel site in `fuel/` (`index.html`, `boats.html`, `marinas.html`, `supply.html`, `contact.html`, `fuel.css`, `fuel.js`)
- Edit the member app in `app/` (`index.html`, `app.js`, `app.css`, `manifest.json`, `sw.js`)
- Add real brand plates to `assets/img/` (change the filename if replacing a cached image)
- Leave **`app/catalog.json`** on disk as a labeled example only. It is not the live catalog.
- Keep the apply webhook in `assets/js/site.js` **and** `fuel/fuel.js` as `https://rjmrio.app.n8n.cloud/webhook/cc-apply`
- Read and update `ops/waterdog/` (Airtable Omni, CSVs, n8n import, quote template). That folder is the Waterdog desk.

### You must not

- 302 `/app` to grok.me, vercel.app, or any host other than coastalcavaliers.com
- Hide the app in the footer only. Header CTA stays **Check your water**. The Gulf Sunrise rail is **Join the club** + **Get the app** — keep both, both on this domain.
- Collapse the marketing homepage and the member app into one page
- Invent makers, baker profiles, food photography, or heraldry
- Take money. Stripe lives on the website later. The app holds only. Waterdog does **not** take fuel money from `/fuel`.
- Invent `/webhook/cc-order` or `/webhook/wd-apply`. Holds are WF1-shaped. Waterdog names use the **same** `cc-apply` URL, tagged in Notes.
- Dump a Node/Vite/TanStack build here. This repo has **no build step**. The app is static HTML/CSS/JS.
- Change the club homepage when you are working on Waterdog. Fuel lives after **Launch fuel site** on `/waterdog` and at `/fuel`.
- Mix Waterdog books with club bread. Separate company. Separate Airtable when `WD_Operations` exists.

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

Live source is **GET** `https://rjmrio.app.n8n.cloud/webhook/cc-catalog` (n8n `CC_WF_Catalog`). CORS for `https://coastalcavaliers.com`. The webhook reads `CC_Operations` SKUs + Makers and returns the existing catalog.json shape.

- Only **Record class = Real** AND **SKU status = Live**.
- **TEST never publishes.** A TEST row that is Live still stays off the site.
- Today that Real + Live set is empty, so `products` is `[]` until a Real Live row exists.
- Do not invent makers. Do not fall back to the example box (Lake loaf / Example / Bayshore / Fulton) when the webhook is empty or errors.
- The member app (`app/app.js`) and the homepage “This week aboard” box both fetch this webhook with `cache: "no-store"`. If the JSON has a `products` array — even empty — use that. If the webhook fails, show an honest empty state: **no live lines this week**.
- WF0 GitHub overwrite of `app/catalog.json` is **no longer the live path**.
- `app/catalog.json` stays on disk as a labeled example only. It is not shown as live.

Price is dollars (not cents). `capRemaining` is `capacity - capacity_sold`.

## Data (not GitHub)

| Event | Path |
|---|---|
| Site waitlist / maker / marina | POST `https://rjmrio.app.n8n.cloud/webhook/cc-apply` (WF2, source = Site) |
| Waterdog request / marina invoice / wet-hose waitlist | Same webhook. Notes begin `Waterdog Fuel —`. Filter Applications on that. |
| App hold | Browser localStorage, WF1-shaped payload. App never bills. |
| Cycle | America/Chicago, Wednesday-noon cutoff, Saturday delivery, cluster `CL-01` |

n8n writes Airtable. GitHub does not.

Bots: read `ops/waterdog/README.md` before touching Waterdog intake. Import files live there (`WD_WF_Notify.json`, `WD_Airtable_Omni.txt`, `airtable-csvs/`). Do not invent a second webhook to make those files "live" — they are imports for n8n / Airtable, not something Netlify runs.

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

Waterdog Fuel on `/fuel` is Logo Blue + oyster + Deep Gold. No Gulf Sunrise rail. Slogan: **Rack to dock.**

## App Store

The member app is a PWA on coastalcavaliers.com/app (Add to Home Screen). A native App Store / Play Store listing is a later wrap of **this same app**, not a new website. Do not stand up a side domain for it.
