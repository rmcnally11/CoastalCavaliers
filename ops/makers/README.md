# Maker portal ops — Coastal Cavaliers

**Goal:** First Jerry and the 200th Jerry use the same objects. Airtable holds them for MVP. Postgres can take the same nouns later without a rewrite of the business.

**Rule (same as club ops):** n8n is the only writer to Airtable. The portal never talks to Airtable with a client-side key.

---

## Surfaces

| Surface | URL | Who |
|--------|-----|-----|
| Apply to sell | `/makers`, `/apply` | Public |
| Maker sign-in | `/makers/portal` | Approved makers only |
| Ops desk | Airtable `CC_Operations` | Robert / desk |

Member app stays `/app`. Maker portal is a **role**, not a second brand.

---

## Tables (Airtable now → Postgres later)

### `Makers`

| Field | Type | Notes |
|-------|------|--------|
| maker_id | Text / autoname | Stable id, e.g. `m_jerry_01` |
| name | Text | Contact name |
| business | Text | |
| email | Email | Login identity |
| phone | Phone | |
| city | Text | |
| zip | Text | Routing hint only |
| tier | Single select | `Cottage` / `Licensed` |
| reg_number | Text | |
| status | Single select | `Applied` / `Approved` / `Suspended` / `Rejected` |
| portal_access | Checkbox | Must be true to sign in |
| delivery_pref | Single select | `Deliver` / `Pickup` |
| notes | Long text | |
| approved_at | Date | |
| source | Text | `Site` etc. |

**Approve Jerry:** set `status = Approved` and `portal_access = ✓`. n8n sends invite.

### `SKUs`

| Field | Type | Notes |
|-------|------|--------|
| sku_id | Text | Stable id |
| maker | Link → Makers | |
| name | Text | e.g. Banana bread |
| category | Single select | Allowlist only (see below) |
| description | Long text | |
| price_cents | Number | Integer cents — scale-safe |
| unit | Text | loaf, dozen, 12oz bag |
| allergens | Text | |
| cold | Checkbox | |
| status | Single select | `Draft` / `Pending` / `Live` / `Paused` / `Rejected` |
| capacity | Number | This week; Jerry may **raise anytime** |
| capacity_sold | Number | Filled by order pipeline; default 0 |
| photo_url | URL | Optional MVP |
| notes | Long text | Ops reject reason etc. |

**Approve a product:** `status = Live` only after review. Jerry creates → `Pending`.

**Capacity rule:** Jerry may increase `capacity` after the member window opens. He must not set `capacity` below `capacity_sold` without ops override.

### `Drops`

| Field | Type | Notes |
|-------|------|--------|
| drop_id | Text | e.g. `CL-01` |
| name | Text | Cooler / handover name |
| status | Single select | `Planned` / `Active` / `Paused` |
| notes | Long text | Gate codes — ops only |

### `Marinas`

| Field | Type | Notes |
|-------|------|--------|
| marina_id | Text | |
| name | Text | |
| city | Text | |
| zip | Text | |
| drop | Link → Drops | Which cooler serves this marina |
| slips_approx | Number | |
| status | Single select | `Prospect` / `Active` / `Paused` |

### `Maker_Drops` (or linked records both ways)

| Field | Type | Notes |
|-------|------|--------|
| maker | Link → Makers | |
| drop | Link → Drops | |
| status | Single select | `Active` / `Paused` |

Jerry’s Live SKUs appear only for members whose marina’s **drop** is in his active Maker_Drops.

### `Orders` / `Payouts`

Stubs until ordering is live. Same nouns later in Postgres.

---

## Category allowlist (SKU)

`Bread`, `Coffee`, `Smoked fish`, `Cheese`, `Pantry`, `Sauce`, `Sweet`, `Other galley`

---

## Weekly cycle

- Timezone: `America/Chicago`
- Member cutoff: Wednesday noon
- Jerry capacity: raise anytime; never below sold without ops

---

## n8n webhooks

Existing: `POST https://rjmrio.app.n8n.cloud/webhook/cc-apply`

**Add:**

| Path | Job |
|------|-----|
| `/webhook/cc-maker-auth` | Magic link / code |
| `/webhook/cc-maker-api` | list_skus, upsert_sku, set_capacity, list_payouts |

Portal UI: `/makers/portal` (demo sign-in works offline until these are live).

### Approve in Airtable

1. Makers — Applied → status `Approved`, portal_access ✓
2. SKUs — Pending → status `Live`

---

## Scale

At ~200 Jerrys, migrate these tables to Postgres + API. **Do not rename entities.**
