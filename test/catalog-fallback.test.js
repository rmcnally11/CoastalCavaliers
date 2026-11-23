"use strict";

const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const QUIET = {
  ok: false,
  note: "No live lines this week.",
  cluster: {},
  products: [],
};

const DEFAULT_UPSTREAM = "https://rjmrio.app.n8n.cloud/webhook/cc-catalog";

function load() {
  const abs = path.join(__dirname, "..", "netlify/functions/catalog.js");
  delete require.cache[require.resolve(abs)];
  return require(abs);
}

beforeEach(() => {
  global.fetch = async function refuse() {
    throw new Error("refusing live network in tests");
  };
});

async function withErrors(fn) {
  const logs = [];
  const orig = console.error;
  console.error = function () {
    logs.push(Array.prototype.slice.call(arguments));
  };
  try {
    return { res: await fn(), logs: logs };
  } finally {
    console.error = orig;
  }
}

test("a rejected catalog fetch stays a quiet week with ok false", async () => {
  global.fetch = async function reject() {
    throw new Error("catalog upstream unreachable");
  };
  const { res, logs } = await withErrors(() => load().handler({ httpMethod: "GET" }));
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Access-Control-Allow-Origin"], "https://coastalcavaliers.com");
  assert.equal(res.headers["Content-Type"], "application/json");
  assert.equal(res.headers["Cache-Control"], undefined);
  assert.deepEqual(JSON.parse(res.body), QUIET);
  assert.deepEqual(logs, [["catalog upstream unreachable"]]);
});

test("a non-ok catalog upstream logs the status and stays a quiet week", async () => {
  global.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ products: [{ sku: "CC-LOAF", name: "Loaf" }] }),
  });
  const { res, logs } = await withErrors(() => load().handler({ httpMethod: "GET" }));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), QUIET);
  assert.deepEqual(logs, [["catalog upstream 404"]]);
});

test("a good catalog upstream is ok true and drops TEST SKUs", async () => {
  const previous = process.env.N8N_CATALOG_WEBHOOK;
  delete process.env.N8N_CATALOG_WEBHOOK;
  let called;
  global.fetch = async (url, opts) => {
    called = { url: url, cache: opts && opts.cache };
    return {
      ok: true,
      status: 200,
      json: async () => ({
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
    };
  };
  try {
    const { res, logs } = await withErrors(() => load().handler({ httpMethod: "GET" }));
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["Cache-Control"], "public, max-age=0, must-revalidate");
    assert.equal(res.headers["Access-Control-Allow-Origin"], "https://coastalcavaliers.com");
    const body = JSON.parse(res.body);
    assert.equal(body.ok, true);
    assert.equal(body.note, "Live catalog. TEST excluded.");
    assert.equal(body.cluster.id, "CL-01");
    assert.deepEqual(body.products.map((p) => p.sku), ["CC-LOAF"]);
    assert.equal(body.products[0].price, 9);
    assert.deepEqual(logs, []);
    assert.deepEqual(called, { url: DEFAULT_UPSTREAM, cache: "no-store" });
  } finally {
    if (previous === undefined) delete process.env.N8N_CATALOG_WEBHOOK;
    else process.env.N8N_CATALOG_WEBHOOK = previous;
  }
});
