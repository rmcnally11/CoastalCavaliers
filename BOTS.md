# Bot contract — Coastal Cavaliers

Two products. One data spine. **Do not make one surface serve as the other.**

Authoritative package: Drive folder `00 CURRENT — Coastal Cavaliers package (v16.1)`.

| Surface | Job | File source of truth | Deploy |
|---|---|---|---|
| **Website** | Marketing, waitlist, maker/marina applications, Slop Chest preview | GitHub `rmcnally11/CoastalCavaliers` | Netlify ← `main` |
| **Member app** | Catalog, box, cutoff, drop, last-box reorder | This Grok workspace (not the Netlify repo) | Vercel on Grok Publish |
| **Operations** | Applications, orders, members, POs | Airtable `CC_Operations` | n8n is the only writer |

## Roles

| Bot | Job | Must not |
|---|---|---|
| **Heavy** | Publish **this Grok workspace** to a **public** Vercel HTTPS URL. Send Robert that URL when it is live. Tell Commodore. | Dump TanStack into `rmcnally11/CoastalCavaliers`. Invent `/webhook/cc-order`. Replace the live `/app` stub. Change the homepage header. |
| **Commodore** | After Heavy’s URL is live, point **Get the app** at it (Netlify `_redirects` 302). Until then **Get the app stays on `/app`**. Keep `app/catalog.json` on Netlify (file shadowing). | 302 `/app` before a public URL exists. Dump TanStack. Touch the homepage header. |

## Heavy brief (verbatim, 2026-08-19)

Publish the Coastal Cavaliers member box from this Grok workspace to Vercel. Do not dump the TanStack app into github.com/rmcnally11/CoastalCavaliers. That repo is the marketing site only (Netlify).

1. Publish this workspace to a public HTTPS URL on Vercel. Send Robert that production URL when it is live. Do not invent a second n8n order webhook.

2. The app reads catalog from https://coastalcavaliers.com/app/catalog.json (WF0 overwrites that file). If the fetch fails, use the bundled example box. Makers are Example or Cavaliers Galley only. No invented makers. No food photos.

3. The app holds only. No Stripe. No checkout. No cart that takes money. Holds are WF1-shaped. Cycle is America/Chicago, Wednesday-noon cutoff, Saturday delivery, cluster CL-01.

4. Do not replace coastalcavaliers.com/app (the coming-soon stub) with the full app. Do not change the homepage header. Header stays Check your water. The Gulf Sunrise rail stays Join the club → /#waitlist and Get the app.

5. After the Vercel URL is live, tell Commodore. He will point Get the app at that URL. Until then Get the app stays on /app.

If you cannot publish from this workspace, say so and give the exact block. Do not put the app in the Netlify repo as a workaround.

## Exact block (this workspace cannot fire Vercel)

Heavy / Commodore in this Grok sandbox **cannot** publish a public HTTPS URL.

1. Workspace contract (`AGENTS.md`): the agent never triggers the Vercel deploy. Robert taps **Publish** in the Grok UI. The platform then deploys to Vercel and injects `DATABASE_URL`, auth, `VITE_PROJECT_ID`, `VITE_PUBLIC_HOSTNAME`.
2. `vercel` CLI is present but **not logged in**. No `VERCEL_TOKEN` in env. `vercel whoami` → “No existing credentials found.”
3. No `VITE_PROJECT_ID` / `VITE_PUBLIC_HOSTNAME` in this sandbox (those appear only after Grok Publish).
4. Guessed hosts (`coastal-cavaliers.grok.me`, `coastalcavaliers.grok.me`, and peers) all return the cached Vercel **App not Found** placeholder (3142 bytes, last-modified 2026-08-11). `*.vercel.app` guesses return `DEPLOYMENT_NOT_FOUND`.
5. Gmail has no grok.me / vercel.app URL for this app.
6. **Do not** dump the TanStack app into `rmcnally11/CoastalCavaliers` as a workaround. That repo is static HTML for Netlify.
7. **Get the app stays `/app`** (coming-soon stub) until a public HTTPS URL exists. Then Commodore 302s `/app` (not `app/catalog.json`) to that URL.

**Unblock:** Robert taps **Publish** as **Public** in this Grok chat, then pastes the production URL here (or it appears as `something.grok.me`). Private publish is invisible to Commodore. After the URL is live, Commodore points Get the app.

## GitHub (`rmcnally11/CoastalCavaliers`)

Static HTML. Push to `main` and Netlify serves it. That is how bots update the **desktop site**.

### You may

- Edit copy in `index.html`, `makers.html`, `marinas.html`, `apply.html`, `waitlist.html`, `sport.html`, `waterdog.html`
- Add real brand plates to `assets/img/` (change the filename if replacing a cached image)
- Overwrite **`app/catalog.json`** (WF0). This is the catalog the member app reads.
- Keep the apply webhook in `assets/js/site.js` as `https://rjmrio.app.n8n.cloud/webhook/cc-apply`

### You must not

- Dump the TanStack member app into this repo
- Hide the app in the footer only. Header CTA stays **Check your water**. The Gulf Sunrise rail is **Join the club** + **Get the app** — keep both. Until Heavy’s URL is live, `Get the app` points at `/app`.
- Collapse the two surfaces into one page
- Invent makers, baker profiles, food photography, or heraldry
- Take money. Stripe lives on the website later. The app holds only.
- Invent `/webhook/cc-order`. Holds are WF1-shaped. Do not invent a second n8n URL.
- Replace `app/index.html` (coming-soon stub) with the full member app
- 302 `/app` before Heavy hands Commodore a public HTTPS URL

### Commodore — after Heavy’s URL exists

`_redirects` today:

```
/app        /app/index.html  200
```

Change **only** that line to a 302 at Heavy’s public URL. Keep `app/catalog.json` on this repo so WF0 still overwrites the live catalog. File shadowing means `/app/catalog.json` stays on Netlify even if `/app` redirects.

## Catalog

`app/catalog.json` in this GitHub repo is the file WF0 overwrites.

- Live URL: `https://coastalcavaliers.com/app/catalog.json`
- Member-app fallback (this workspace): `public/app/catalog.json`
- Example box only until a live manifest exists. No photographs. Maker is `Example` or `Cavaliers Galley`.

When WF0 commits a new catalog to GitHub, Netlify publishes it and the member app fetches that URL (falls back to the bundled example box if the fetch fails). CORS on that JSON is `Access-Control-Allow-Origin: *`.

## Data (not GitHub)

| Event | Path |
|---|---|
| Site waitlist / maker / marina | POST `https://rjmrio.app.n8n.cloud/webhook/cc-apply` (WF2, source = Site) |
| App hold | PGLite/Postgres ledger + WF1-shaped payload. App never bills. |
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
