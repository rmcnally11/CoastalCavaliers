"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const pages = [
  ["/", "index.html"],
  ["/makers", "makers.html"],
  ["/marinas", "marinas.html"],
  ["/apply", "apply.html"],
  ["/waitlist", "waitlist.html"],
  ["/chest", "chest.html"],
  ["/sport", "sport.html"],
  ["/privacy", "privacy.html"],
];

const doors = ["/waitlist", "/apply", "/makers", "/marinas"];

function section(html, tag) {
  const m = new RegExp("<" + tag + "\\b[^>]*>([\\s\\S]*?)</" + tag + ">", "i").exec(html);
  return m ? m[1] : "";
}

function hrefs(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]);
}

function pathOf(href) {
  const noHash = href.split("#", 1)[0];
  if (!noHash) return null;
  let p = noHash;
  if (/^https?:\/\//i.test(p)) {
    let url;
    try {
      url = new URL(p);
    } catch (err) {
      return null;
    }
    if (url.hostname !== "coastalcavaliers.com") return null;
    p = url.pathname;
  }
  if (!p.startsWith("/")) return null;
  p = p.split("?", 1)[0];
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function jpegSize(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error("not a jpeg");
  let i = 2;
  while (i + 8 < buf.length) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  throw new Error("jpeg size missing");
}

test("club pages link the four sign-up paths from the nav and the footer", () => {
  const missing = [];
  for (const [route, file] of pages) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    const nav = section(html, "nav");
    const footer = section(html, "footer");
    for (const door of doors) {
      const navHit = hrefs(nav).some((href) => pathOf(href) === door);
      const footHit = hrefs(footer).some((href) => pathOf(href) === door);
      if (!navHit) missing.push(route + " nav " + door);
      if (!footHit) missing.push(route + " footer " + door);
    }
  }
  assert.deepEqual(missing, []);
});

test("apply and waitlist use distinct share cards", () => {
  function og(html) {
    const m = /property="og:image" content="([^"]+)"/.exec(html);
    return m ? m[1] : "";
  }
  function tw(html) {
    const m = /name="twitter:image" content="([^"]+)"/.exec(html);
    return m ? m[1] : "";
  }
  const apply = fs.readFileSync(path.join(root, "apply.html"), "utf8");
  const wait = fs.readFileSync(path.join(root, "waitlist.html"), "utf8");
  const makers = fs.readFileSync(path.join(root, "makers.html"), "utf8");
  const marinas = fs.readFileSync(path.join(root, "marinas.html"), "utf8");
  const applyOg = og(apply);
  const waitOg = og(wait);
  assert.equal(applyOg, "https://coastalcavaliers.com/assets/img/og-apply.jpg");
  assert.equal(waitOg, "https://coastalcavaliers.com/assets/img/og-waitlist.jpg");
  assert.notEqual(applyOg, waitOg);
  assert.equal(tw(apply), applyOg);
  assert.equal(tw(wait), waitOg);
  assert.equal(og(makers), "https://coastalcavaliers.com/assets/img/og-makers.jpg");
  assert.equal(og(marinas), "https://coastalcavaliers.com/assets/img/og-marinas.jpg");
  assert.equal(tw(makers), og(makers));
  assert.equal(tw(marinas), og(marinas));
  for (const name of ["og-apply.jpg", "og-waitlist.jpg"]) {
    const size = jpegSize(path.join(root, "assets/img", name));
    assert.deepEqual(size, { width: 1200, height: 630 });
  }
});
