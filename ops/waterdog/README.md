# Waterdog Fuel — operations

Separate company. Separate books. Until the name is ours, the site lives at
`https://coastalcavaliers.com/fuel`.

## What already works

Fuel pages POST to the **Waterdog** Netlify function, not the club apply webhook:

```
POST /.netlify/functions/waterdog
```

That function forwards to n8n `wd-intake`. n8n writes:

- **Leads** (`tblvrcVJcGxlRkSX2`) for Marina / Boat / Talk
- **Newsletter** (`tbldZETrSxw2xRsKz`) when `list=newsletter`

Base: `WD_Operations` `appeh32eXzdh1leyZ`.

A marina conversation is not a club marina application. Do not write Waterdog
site intake into `CC_Operations` → Applications.

We do **not** take fuel money from the site. No diagnose quote from a public form.
No gallons sold from a flyer.

## Opening bases

Houston · Tampa · Fort Lauderdale. Pensacola on the board. Next: SC, GA, NC.

The Leads **Base** field is that list. Status starts **New**. Source is **Site**.

## GATE 5

We do not wet-hose until pollution insurance is bound. Tickets stay empty until then.

## What not to do

- Do not post Waterdog forms to `cc-apply`.
- Do not create a diagnose Quote from a website questionnaire (no rack dollars).
- Do not invent host marinas.
- Do not take a card.
