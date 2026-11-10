"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const skipDir = new Set(["sitepkg", "node_modules", ".git"]);

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (skipDir.has(name)) continue;
    const abs = path.join(dir, name);
    const st = fs.statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else if (name.endsWith(".html")) out.push(abs);
  }
  return out;
}

function redirects() {
  const map = new Map();
  const text = fs.readFileSync(path.join(root, "_redirects"), "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) continue;
    const [from, to, status] = parts;
    if (from.includes("*")) continue;
    map.set(from.replace(/\/$/, "") || "/", { to, status: Number(status) });
  }
  return map;
}

function strip(url) {
  const hash = url.indexOf("#");
  const noHash = hash === -1 ? url : url.slice(0, hash);
  const q = noHash.indexOf("?");
  return q === -1 ? noHash : noHash.slice(0, q);
}

function resolveLocal(fromFile, raw) {
  const value = strip(raw.trim());
  if (!value || value.startsWith("#")) return null;
  if (/^(mailto:|tel:|javascript:|data:)/i.test(value)) return null;
  if (/^https?:\/\//i.test(value)) {
    if (value.startsWith("https://coastalcavaliers.com")) {
      return new URL(value).pathname;
    }
    return null;
  }
  if (value.startsWith("/")) return value;
  const rel = path.posix.join(path.dirname(path.relative(root, fromFile)).split(path.sep).join("/"), value);
  return "/" + rel.replace(/^\.\//, "");
}

function fileForPath(urlPath, map) {
  let p = urlPath.split("?")[0];
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  const key = p || "/";
  const rule = map.get(key);
  if (rule) {
    if (rule.status === 404) return { ok: false, reason: "redirects to 404" };
    if (rule.status === 301 || rule.status === 302) {
      return fileForPath(rule.to, map);
    }
    p = rule.to;
  }
  const rel = decodeURIComponent(p).replace(/^\//, "");
  const abs = path.join(root, rel);
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return { ok: true, file: abs };
  if (fs.existsSync(path.join(abs, "index.html"))) return { ok: true, file: path.join(abs, "index.html") };
  const html = abs.endsWith(".html") ? abs : abs + ".html";
  if (fs.existsSync(html)) return { ok: true, file: html };
  return { ok: false, reason: "missing file" };
}

function attrs(html) {
  const found = [];
  const re = /<(?:a|img|script|link|source)\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const href = /(?:href|src)=["']([^"']+)["']/i.exec(tag);
    if (href) found.push(href[1]);
  }
  return found;
}

test("published pages and the sitemap point at files that exist", () => {
  const map = redirects();
  const pages = walk(root, []);
  const missing = [];
  for (const file of pages) {
    const html = fs.readFileSync(file, "utf8");
    for (const raw of attrs(html)) {
      const local = resolveLocal(file, raw);
      if (!local) continue;
      const hit = fileForPath(local, map);
      if (!hit.ok) missing.push(path.relative(root, file) + " -> " + raw + " (" + hit.reason + ")");
    }
  }
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  for (const loc of sitemap.match(/<loc>([^<]+)<\/loc>/g) || []) {
    const url = loc.replace(/<\/?loc>/g, "");
    const hit = fileForPath(new URL(url).pathname, map);
    if (!hit.ok) missing.push("sitemap " + url + " (" + hit.reason + ")");
  }
  assert.deepEqual(missing, []);
});
