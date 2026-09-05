# Bot contract — Coastal Cavaliers

One club. Two surfaces. **Same domain.** Waterdog Fuel is a **third** surface: a separate company, served from this same repo at `/fuel` until the Waterdog domain exists.

Authoritative package: Drive folder `00 CURRENT — Coastal Cavaliers package (v16.1)`.

| Surface | Job | File source of truth | Deploy |
|---|---|---|---|
| **Website** | Marketing, waitlist, maker/marina applications, Slop Chest preview | GitHub `rmcnally11/CoastalCavaliers` | Netlify ← `main` |
| **Member app** | Catalog, box, cutoff, drop, last-box reorder, home-screen install | GitHub `app/` in the same repo | Netlify serves `https://coastalcavaliers.com/app` |
| **Waterdog Fuel** | Rack-to-dock / wet-hose site. Opening 2027. Not taking fuel money. | GitHub `fuel/` | Netlify serves `https://coastalcavaliers.com/fuel` |
| **Operations** | Applications, orders, members, POs | Airtable `CC_Operations` | n8n is the only writer |
| **Waterdog ops** | Leads, quotes, invoices, tickets, hosts | Airtable `WD_Operations` (`appeh32eXzdh1leyZ`). Site intake writes Leads and Newsletter via n8n `wd-intake`. | n8n is the only writer |

**Do not send `/app` to a Grok, Vercel, or other side URL.** Robert reversed that on 2026-08-21. The member app is part of coastalcavaliers.com. Bots update it by pushing files in `app/` to this repo.

## Roles

| Bot | Job | Must not |
|---|---|---|
| **Heavy / any Grok bot** | Keep the member app working **in this repo** at `app/`. Edit `app/index.html`, `app/app.js`, `app/app.css`, `app/manifest.json`, `app/sw.js`. Push to `main`. Netlify publishes to coastalcavaliers.com/app. | 302 `/app` off-site. Dump a TanStack/Vite/Nitro build into this static repo. Invent `/webhook/cc-order`. Change the homepage header. |
| **Commodore** | Keep `_redirects` serving `/app` as `/app/index.html` (200). Keep `app/catalog.json` on this site (file shadowing). | Point Get the app at grok.me / vercel.app / any other host. |

## GitHub (`rmcnally11/CoastalCavaliers`)

Static HTML. Push to `main` and Netlify serves it. That is how bots update **the club site, the member app, and Waterdog Fuel**.

### You may

- Edit copy in `index.html`, `makers.html`, `marinas.html`, `apply.html`, `waitlist.html`, `sport.html`. `/waterdog` redirects to `/fuel`.
- Edit the Waterdog Fuel site in `fuel/` (`index.html`, `boats.html`, `marinas.html`, `supply.html`, `contact.html`, `fuel.css`, `fuel.js`)
- Edit the member app in `app/` (`index.html`, `app.js`, `app.css`, `manifest.json`, `sw.js`)
- Add real brand plates to `assets/img/` (change the filename if replacing a cached image)
- Leave **`app/catalog.json`** on disk as a labeled example only. It is not the live catalog.
- Keep club apply behind `/.netlify/functions/apply`. Keep Waterdog intake behind `/.netlify/functions/waterdog` → n8n `wd-intake`. Never put the n8n URL in page source.
- Read and update `ops/waterdog/` (Airtable Omni, CSVs, n8n import, quote template). That folder is the Waterdog desk.

### You must not

- 302 `/app` to grok.me, vercel.app, or any host other than coastalcavaliers.com
- Hide the app in the footer only. Header CTA stays **Check your water**. The Gulf Sunrise rail is **Join the club** + **Get the app** — keep both, both on this domain.
- Collapse the marketing homepage and the member app into one page
- Invent makers, baker profiles, food photography, or heraldry
- Take money. Stripe lives on the website later. The app holds only. Waterdog does **not** take fuel money from `/fuel`.
- Invent `/webhook/cc-order`. Holds are WF1-shaped. Waterdog site names go to `WD_Operations` via `wd-intake`, not club Applications.
- Dump a Node/Vite/TanStack build here. This repo has **no build step**. The app is static HTML/CSS/JS.
- Change the club homepage when you are working on Waterdog. Fuel lives at `/fuel`. `/waterdog` 301s there until the name is ours.
- Mix Waterdog books with club bread. Separate company. Separate Airtable when `WD_Operations` exists.

### Search (do not undo)

Chart Room, 2026-09-05. The name collides with the Cleveland Cavaliers.

- Club title, H1, and Organization schema must carry a qualifier: **boat provisioning club** plus **Galveston Bay / Clear Lake / Kemah / Seabrook**. Do not ship a title that is only “Coastal Cavaliers — Local hands, open water.”
- `twitter:card` is `summary_large_image`. Club share card: `assets/img/og-club.jpg`. Waterdog: `assets/img/og-waterdog.jpg`. Both 1200×630. Do not point `og:image` at the square crest.
- Waterdog titles say **trucked marine diesel**. Never “marina fuel” and never “fuel at the slip” — that is Dock Posted. One footer link on `/fuel`: “What they posted on the pump” → `https://www.dockposted.com/`.
- Club footer links On This Water once: “Tide and wind before you leave” → `https://onthiswater.com/`.

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
| Waterdog marina / boat / talk / fuel list | POST `/.netlify/functions/waterdog` → n8n `wd-intake` → `WD_Operations` Leads or Newsletter. Not club Applications. |
| App hold | Browser localStorage, WF1-shaped payload. App never bills. |
| Cycle | America/Chicago, Wednesday-noon cutoff, Saturday delivery, cluster `CL-01` |

n8n writes Airtable. GitHub does not.

Bots: read `ops/waterdog/README.md` before touching Waterdog intake. Live path is `/.netlify/functions/waterdog` → n8n `WD_WF_Site_Intake` (`wd-intake`) → `WD_Operations`. The files in `ops/waterdog/` are desk notes, not a second public webhook.

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
