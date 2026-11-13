"use strict";

const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

function load(rel) {
  const abs = path.join(__dirname, "..", rel);
  delete require.cache[require.resolve(abs)];
  return require(abs);
}

beforeEach(() => {
  global.fetch = async function refuse() {
    throw new Error("refusing live network in tests");
  };
});

test("catalog keeps a real SKU and drops test rows", async () => {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      note: "live",
      cluster: { id: "CL-01" },
      products: [
        { sku: "sku_test_loaf", name: "Example" },
        { sku: "TEST-bay", name: "Example" },
        { sku: "test_fulton", name: "Example" },
        { sku: "", name: "blank" },
        null,
        { sku: "CC-LOAF", name: "Loaf", price: 9 },
      ],
    }),
  });
  const res = await load("netlify/functions/catalog.js").handler({ httpMethod: "GET" });
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.deepEqual(body.products.map((p) => p.sku), ["CC-LOAF"]);
  assert.equal(body.cluster.id, "CL-01");
});

test("a failed catalog upstream is an empty board", async () => {
  global.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ products: [{ sku: "CC-LOAF", name: "Loaf" }] }),
  });
  const res = await load("netlify/functions/catalog.js").handler({ httpMethod: "GET" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body).products, []);
});

test("catalog network errors stay an empty board", async () => {
  const res = await load("netlify/functions/catalog.js").handler({ httpMethod: "GET" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body).products, []);
});

test("waterdog rejects a post with no email and does not call upstream", async () => {
  let called = 0;
  global.fetch = async () => {
    called += 1;
    return { status: 200, text: async () => "", headers: { get: () => "application/json" } };
  };
  const res = await load("netlify/functions/waterdog.js").handler({
    httpMethod: "POST",
    body: JSON.stringify({ kind: "Boat", name: "Ada" }),
  });
  assert.equal(res.statusCode, 400);
  assert.equal(called, 0);
});

test("waterdog forwards an allowlisted boat lead and drops extra fields", async () => {
  let sent;
  global.fetch = async (url, opts) => {
    sent = { url, body: JSON.parse(opts.body) };
    return { status: 200, text: async () => "{\"ok\":true}", headers: { get: () => "application/json" } };
  };
  const res = await load("netlify/functions/waterdog.js").handler({
    httpMethod: "POST",
    body: JSON.stringify({
      kind: "Boat",
      email: "ada@example.com",
      name: "Ada",
      base: "Houston",
      company_website: "spam.example",
      type: "Waitlist",
      secret: "nope",
    }),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(sent.body.email, "ada@example.com");
  assert.equal(sent.body.kind, "Boat");
  assert.equal(sent.body.base, "Houston");
  assert.equal(sent.body.source, "Site");
  assert.equal(sent.body.company_website, undefined);
  assert.equal(sent.body.type, undefined);
  assert.equal(sent.body.secret, undefined);
  assert.equal(String(sent.url).includes("cc-apply"), false);
});

test("apply posts the unchanged body to the rmc11 intake", async () => {
  const previous = process.env.N8N_APPLY_WEBHOOK;
  delete process.env.N8N_APPLY_WEBHOOK;
  let sent;
  global.fetch = async (url, opts) => {
    sent = { url, opts };
    return { status: 200, text: async () => "{\"ok\":true}", headers: { get: () => "application/json" } };
  };
  const body = JSON.stringify({
    type: "Waitlist",
    source: "Site",
    name: "Ada",
    email: "ada@example.com",
    zip: "77565",
    notes: "Application: cc-test",
  });
  try {
    const res = await load("netlify/functions/apply.js").handler({ httpMethod: "POST", body });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body, "{\"ok\":true}");
    assert.equal(sent.url, "https://rmc11.app.n8n.cloud/webhook/cc-apply");
    assert.equal(sent.opts.method, "POST");
    assert.equal(sent.opts.headers["Content-Type"], "application/json");
    assert.equal(sent.opts.body, body);
  } finally {
    if (previous === undefined) delete process.env.N8N_APPLY_WEBHOOK;
    else process.env.N8N_APPLY_WEBHOOK = previous;
  }
});

test("the deployable site has no old cc-apply webhook", () => {
  const needle = ["https://", "rj", "mrio.app.n8n.cloud", "/webhook/", "cc-apply"].join("");
  const root = path.join(__dirname, "..");
  const skipDir = new Set([".git", "node_modules"]);
  const skipExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2", ".pdf", ".zip"]);
  const hits = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (skipDir.has(name)) continue;
      const abs = path.join(dir, name);
      const st = fs.statSync(abs);
      if (st.isDirectory()) {
        walk(abs);
        continue;
      }
      if (skipExt.has(path.extname(name).toLowerCase())) continue;
      if (fs.readFileSync(abs, "utf8").includes(needle)) hits.push(path.relative(root, abs));
    }
  }
  walk(root);
  assert.deepEqual(hits, []);
});
