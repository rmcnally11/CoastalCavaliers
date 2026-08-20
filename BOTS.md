# Bot contract — Coastal Cavaliers

Two products. One data spine. **Do not make one surface serve as the other.**

Authoritative package: Drive folder `00 CURRENT — Coastal Cavaliers package (v16.1)`.

| Surface | Job | File source of truth | Deploy |
|---|---|---|---|
| **Website** | Marketing, waitlist, maker/marina applications, Slop Chest preview | GitHub `rmcnally11/CoastalCavaliers` | Netlify ← `main` |
| **Member app** | Catalog, box, cutoff, drop, last-box reorder | This Grok workspace (not the Netlify repo) | Vercel on publish |
| **Operations** | Applications, orders, members, POs | Airtable `CC_Operations` | n8n is the only writer |

## GitHub (`rmcnally11/CoastalCavaliers`)

Static HTML. Push to `main` and Netlify serves it. That is how bots update the **desktop site**.

### You may

- Edit copy in `index.html`, `makers.html`, `marinas.html`, `apply.html`, `waitlist.html`, `sport.html`, `waterdog.html`
- Add real brand plates to `assets/img/` (change the filename if replacing a cached image)
- Overwrite **`app/catalog.json`** (WF0). This is the catalog the member app reads.
- Keep the apply webhook in `assets/js/site.js` as `https://rjmrio.app.n8n.cloud/webhook/cc-apply`

### You must not

- Dump the TanStack member app into this repo
- Hide the app in the footer only. Header CTA stays **Check your water**. The Gulf Sunrise rail is **Join the club** + **Get the app** — keep both. `Get the app` points at `/app`.
- Collapse the two surfaces into one page
- Invent makers, baker profiles, food photography, or heraldry
- Take money. Stripe lives on the website later. The app holds only.
- Invent `/webhook/cc-order`. Holds are WF1-shaped. Do not invent a second n8n URL.

## Catalog

`app/catalog.json` in this GitHub repo is the file WF0 overwrites.

- Live URL: `https://coastalcavaliers.com/app/catalog.json`
- Member-app fallback (this workspace): `public/app/catalog.json`
- Example box only until a live manifest exists. No photographs. Maker is `Example` or `Cavaliers Galley`.

When WF0 commits a new catalog to GitHub, Netlify publishes it and the member app fetches that URL (falls back to the bundled example box if the fetch fails).

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
