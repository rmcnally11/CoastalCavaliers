"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

function channel(hexPair) {
  const c = parseInt(hexPair, 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const h = hex.replace("#", "");
  const r = channel(h.slice(0, 2));
  const g = channel(h.slice(2, 4));
  const b = channel(h.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const lighter = Math.max(luminance(a), luminance(b));
  const darker = Math.min(luminance(a), luminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

test("fuel ink links use a light color on the navy band", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "fuel", "fuel.css"), "utf8");
  const root = css.slice(0, css.indexOf("}"));
  const color = (name) => {
    const found = root.match(new RegExp("--" + name + ":(#[0-9A-Fa-f]{6})"));
    assert.ok(found, "--" + name);
    return found[1].toUpperCase();
  };
  const ink = color("ink");
  assert.equal(ink, "#082952");
  const link = css.match(/\.ink a\{color:var\(--([a-z0-9-]+)\)\}/);
  const hover = css.match(/\.ink a:hover\{color:var\(--([a-z0-9-]+)\)\}/);
  assert.ok(link, ".ink a color");
  assert.ok(hover, ".ink a:hover color");
  assert.ok(css.indexOf(".ink a:hover{") > css.indexOf("a:hover{color:var(--ink)}"));
  assert.ok(contrast(color(link[1]), ink) >= 4.5, link[1]);
  assert.ok(contrast(color(hover[1]), ink) >= 4.5, hover[1]);
});
