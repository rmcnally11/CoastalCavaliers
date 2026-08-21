# Waterdog Fuel — operations

Separate company. Separate books. The site already captures. This folder is the rest of the desk.

## What already works (do nothing)

The Waterdog site posts to the **same** n8n webhook as the club:

```
POST https://rjmrio.app.n8n.cloud/webhook/cc-apply
```

WF2 writes `CC_Operations → Applications`. Every Waterdog row has Notes beginning:

- `Waterdog Fuel — request more info`
- `Waterdog Fuel — quote request`
- `Waterdog Fuel — wet-hose waitlist`

In Airtable, filter Applications where Notes contains `Waterdog Fuel`. That is the book, today.

Types WF2 accepts (do not invent a fourth): Maker · Marina · Waitlist.

We do **not** take fuel money from the site. No second webhook. Holds and names only.

## What to import

1. **Waterdog_Operations.xlsx** — open in Drive (already a Sheet if uploaded as one). Working book. Copy Applications rows into Leads until n8n writes here.
2. **WD_WF_Notify.json** — n8n → Import. Activate. It does **not** change the webhook. After WF2 saves an Application, if Notes contain "Waterdog Fuel" it emails `orders@coastalcavaliers.com`. Attach your existing Gmail credential when n8n asks.
3. **WD_Airtable_CSVs.zip** + **WD_Airtable_Omni.txt** — when you are ready to split the books, paste Omni into Airtable, then upload the CSVs in order: Leads → Accounts → Quotes → Invoices → Tickets → Hosts. Rename tables to drop the number prefix.

## Invoices

The Quotes table is the live desk. Site forms tagged `Waterdog Fuel — quote request` land in Applications (filter Notes). Copy those into Quotes when you write the number back. The Invoices table exists so 2027 has a place to land. Do not bill from the website. A ticket is a wet-hose fill after GATE 5. Neither bills a card.

## Covenant

Never wet-hose at a marina with a working fuel dock unless that marina asks. Hosts.Has fuel dock = Yes is the kill switch.
