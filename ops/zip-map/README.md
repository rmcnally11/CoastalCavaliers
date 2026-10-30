# Zip vote map

`data/zips.json` is the only file the waitlist map reads. Edit it by hand. The page never shows a count, a rank, a name, a maker, or a marina.

## Shape

```json
{
  "updated": "YYYY-MM-DD",
  "zips": ["77058", "77586"]
}
```

- `updated` is the day you edited the file.
- `zips` is five-digit strings only.
- No names. No counts. No notes.

## When a zip goes in

Add a zip only when that zip has **two or more Real waitlist rows**. Leave Robert's test rows out of the count. One Real row is not enough. Maker and marina applications do not count.

Count those rows in Airtable `CC_Operations` (the waitlist submissions the site form creates). Do not copy a name or a tally into this file or onto the page.

Remove a zip if it drops below two Real rows.

## How to publish

1. Count Real waitlist rows per zip. Skip Robert's test rows.
2. Edit `data/zips.json`. Set `updated` to the day you edited it.
3. Commit that file and open a PR. Netlify serves it as-is when the commit is on `main`. There is no build step.

The waitlist page fetches `/data/zips.json` and shades a tile one color when its zip is listed. Nothing on the map is a link.

## Tiles already drawn

First-wave tiles stay outlined even when `zips` is empty:

`77058` `77059` `77062` `77504` `77505` `77546` `77565` `77573` `77586` `77598`

Neighbors drawn so a qualifying zip can shade without a new shape:

`77518` `77571`

A listed zip shades only if `waitlist.html` has a `<g data-zip="…">` for it. If a zip qualifies and is not drawn, add one labeled tile in that same schematic. Do not add a second form. Do not print a number on the tile. The drawing is a schematic of the upper bay, not a survey.
