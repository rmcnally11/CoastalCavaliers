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
| aisle | Single select | Member shelf only: `Bread` / `Sweet` / `Savory` / `Drink` / `Other` |
| kind | Text | What it actually is, e.g. Chocolate chip cookies |
| category | Single select | One-release back-compat — same value as `aisle`. Do not use the old 8-item list. |
| description | Long text | |
| price_cents | Number | Integer cents — scale-safe |
| unit | Text | loaf, dozen, 12oz bag |
| allergens | Text | |
| cold | Checkbox | |
| status | Single select | `Draft` / `Pending` / `Live` / `Paused` / `Rejected` |
| capacity | Number | This week; Jerry may **raise anytime** |
| capacity_sold | Number | Filled by order pipeline; default 0 |
| photo | Attachment | Optional. n8n writes from the portal file upload. No client-side Airtable key. |
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

## Shelf mapping (SKU)

Makers do **not** pick from a tight product-type list. Cookies do not belong in Bread. The portal form is:

1. **Aisle** (required select — member shelf only): `Bread`, `Sweet`, `Savory`, `Drink`, `Other`
2. **Kind** (required text): what it actually is. Placeholder example: Chocolate chip cookies. Not a dropdown.
3. **Photo** (optional file input): a real upload, not a URL paste. n8n writes an Airtable attachment on `upsert_sku`. Same webhook path. No Airtable keys in the browser.

`category` may still be stored as a copy of `aisle` for one-release back-compat. Do not treat Coffee / Smoked fish / Cheese / Pantry / Sauce / Other galley as the form allowlist.

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

`upsert_sku` JSON (no photo):

```
{ "action": "upsert_sku", "sku": { "name", "aisle", "kind", "unit", "price_cents", "capacity", "sku_id?" } }
```

`category` may be sent as a copy of `aisle`. Do not send the old 8-item `category` as the only classifier.

When the maker attaches a photo, the portal POSTs `multipart/form-data` to the **same** URL: `action=upsert_sku`, the sku fields (and a `sku` JSON string), plus the file as `photo`. n8n writes the Airtable attachment. No new webhook path.

Portal UI: `/makers/portal` (demo sign-in works offline until these are live).

### Approve in Airtable

1. Makers — Applied → status `Approved`, portal_access ✓
2. SKUs — Pending → status `Live`

---

## Scale

At ~200 Jerrys, migrate these tables to Postgres + API. **Do not rename entities.**
