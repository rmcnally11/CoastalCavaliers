"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const site = fs.readFileSync(path.join(root, "assets", "js", "site.js"), "utf8");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");

const FIRST_WAVE = "<b>You are in the first water.</b> Clear Lake, Kemah, Seabrook. Leave your name &mdash; you will hear when this coast opens. <a href='#waitlist' class='zip-go' style='color:#163867'>Get on the list &rarr;</a>";

const ZIP_NOTE = "Optional &mdash; first-wave zips hear first. Add your name and any other zip counts as a vote for the next water we open.";

test("the out-of-area zip line does not claim a vote before they join", () => {
  assert.equal(site.includes("Your zip is a vote"), false);
  assert.equal(home.includes("Your zip is a vote"), false);
  assert.equal(home.includes("Any other zip is a vote for the next water we open."), false);
  assert.equal(home.includes(ZIP_NOTE), true);
  const line = site.split("\n").find((row) => row.includes("Not first-wave yet"));
  assert.ok(line, "out-of-area line missing");
  assert.match(line, /<a href='\/waitlist' class='zip-go' style='color:#163867'>Add your name<\/a>/);
  assert.equal(site.includes(FIRST_WAVE), true);
});
