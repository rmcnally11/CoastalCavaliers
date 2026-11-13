"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "assets/js/site.js"), "utf8");
const CC_KEYS = [
  "type", "name", "business", "marinaName", "email", "phone", "city", "zip",
  "makerTier", "regNumber", "products", "capacity", "deliveryPref", "slips",
  "shipsStore", "dropType", "boatType", "notes", "source", "intendedPlan",
];
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function classList(initial) {
  const set = new Set(String(initial || "").split(/\s+/).filter(Boolean));
  return {
    contains(name) { return set.has(name); },
    add(name) { set.add(name); },
    remove(name) { set.delete(name); },
    toggle(name, force) {
      const on = force === undefined ? !set.has(name) : !!force;
      if (on) set.add(name);
      else set.delete(name);
      return on;
    },
  };
}

function makeEl(tag, props) {
  const opts = props || {};
  const el = {
    tag: tag,
    id: opts.id || "",
    value: opts.value != null ? String(opts.value) : "",
    hidden: !!opts.hidden,
    disabled: false,
    checked: !!opts.checked,
    type: opts.type || (tag === "button" ? "button" : "text"),
    textContent: opts.textContent || "",
    children: [],
    dataset: Object.assign({}, opts.dataset || {}),
    attributes: Object.assign({}, opts.attributes || {}),
    style: {},
    parentNode: null,
    classList: classList(opts.className || ""),
    focus() {},
    scrollIntoView() {},
    addEventListener() {},
    removeEventListener() {},
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === "id") this.id = String(value);
    },
    getAttribute(name) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, name)) return this.attributes[name];
      return undefined;
    },
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name);
    },
    removeAttribute(name) { delete this.attributes[name]; },
    closest() { return null; },
    contains(node) {
      if (node === this) return true;
      return this.children.some((child) => child.contains && child.contains(node));
    },
  };
  if (opts.id) el.attributes.id = opts.id;
  if (opts.name) el.attributes.name = opts.name;
  if (opts.dataset && opts.dataset.v) el.attributes["data-v"] = opts.dataset.v;
  return el;
}

function walk(node, out) {
  out.push(node);
  for (const child of node.children) walk(child, out);
  return out;
}

function makeDocument() {
  const body = makeEl("body");
  return {
    body,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    createElement(tag) { return makeEl(tag); },
    getElementById(id) {
      return walk(body, []).find((el) => el.id === id) || null;
    },
    querySelector(sel) {
      const found = this.querySelectorAll(sel);
      return found[0] || null;
    },
    querySelectorAll(sel) {
      const all = walk(body, []);
      if (sel === '[name="company_website"]') {
        return all.filter((el) => el.getAttribute("name") === "company_website");
      }
      const picked = /^#([A-Za-z0-9_-]+) \.o\.on$/.exec(sel);
      if (picked) {
        const parent = all.find((el) => el.id === picked[1]);
        if (!parent) return [];
        return parent.children.filter((el) => el.classList.contains("o") && el.classList.contains("on"));
      }
      if (sel.startsWith(".") && !sel.includes(" ") && !sel.includes("#")) {
        const name = sel.slice(1);
        return all.filter((el) => el.classList.contains(name));
      }
      if (sel === "header") return all.filter((el) => el.tag === "header");
      return [];
    },
  };
}

function planOption(plan, on) {
  return makeEl("div", {
    className: on ? "o on" : "o",
    dataset: { v: plan },
    attributes: { role: "radio", "aria-checked": on ? "true" : "false", "data-v": plan },
    textContent: plan,
  });
}

function addPlan(parent) {
  const plan = makeEl("div", { id: "w_plan", attributes: { role: "radiogroup" } });
  plan.appendChild(planOption("Deckhand", true));
  plan.appendChild(planOption("Cavalier", false));
  plan.appendChild(planOption("Commodore", false));
  parent.appendChild(plan);
}

function addWaitlist(doc, twoStep) {
  const root = makeEl("div", { id: "waitlist" });
  const fields = makeEl("div", { id: "wait-form-fields" });
  const honey = makeEl("input", { name: "company_website", value: "" });
  const name = makeEl("input", { id: "w_name", value: "" });
  const email = makeEl("input", { id: "w_email", value: "" });
  const zip = makeEl("input", { id: "w_zip", value: "" });
  const button = makeEl("button", { id: "w_btn", textContent: "Leave your name" });
  fields.appendChild(honey);
  fields.appendChild(name);
  fields.appendChild(email);
  fields.appendChild(zip);
  fields.appendChild(button);
  root.appendChild(fields);

  const confirm = makeEl("div", { id: "wait-confirm", hidden: true });
  confirm.appendChild(makeEl("h2", { id: "wait-confirm-title" }));
  confirm.appendChild(makeEl("p", { id: "wait-confirm-body" }));
  if (twoStep) {
    const boat = makeEl("div", { id: "wait-boat" });
    boat.appendChild(makeEl("input", { id: "w_city", value: "" }));
    boat.appendChild(makeEl("input", { id: "w_marina", value: "" }));
    boat.appendChild(makeEl("select", { id: "w_boat", value: "Sail · cruising" }));
    addPlan(boat);
    boat.appendChild(makeEl("input", { id: "w_chest", type: "checkbox" }));
    boat.appendChild(makeEl("button", { id: "w_details_btn", textContent: "Save these details" }));
    confirm.appendChild(boat);
    confirm.appendChild(makeEl("p", { id: "wait-boat-done", hidden: true }));
  } else {
    root.appendChild(makeEl("input", { id: "w_city", value: "" }));
    root.appendChild(makeEl("input", { id: "w_marina", value: "" }));
    root.appendChild(makeEl("select", { id: "w_boat", value: "Sail · cruising" }));
    addPlan(root);
    root.appendChild(makeEl("input", { id: "w_chest", type: "checkbox" }));
  }
  root.appendChild(confirm);
  doc.body.appendChild(root);
}

function boot(options) {
  const opts = options || {};
  const calls = [];
  const timers = new Set();
  const sandbox = {
    console,
    URLSearchParams: globalThis.URLSearchParams,
    crypto: opts.crypto === undefined ? globalThis.crypto : opts.crypto,
    navigator: {},
    location: {
      search: opts.search || "",
      pathname: opts.pathname || "/waitlist",
      href: "https://coastalcavaliers.com/waitlist",
    },
    sessionStorage: {
      store: new Map(),
      getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
      setItem(key, value) { this.store.set(key, String(value)); },
    },
  };
  sandbox.setTimeout = (fn, ms, ...args) => {
    const id = setTimeout(fn, ms, ...args);
    timers.add(id);
    return id;
  };
  sandbox.clearTimeout = (id) => {
    timers.delete(id);
    clearTimeout(id);
  };
  sandbox.fetch = async (url, init) => {
    calls.push({
      url: String(url),
      method: init && init.method,
      headers: init && init.headers,
      body: JSON.parse(init.body),
    });
    return { ok: true, status: 200 };
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.document = makeDocument();
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "assets/js/site.js" });
  if (opts.door) {
    const band = makeEl("div", { id: "door-list", attributes: { "data-from": "/chest" } });
    band.appendChild(makeEl("input", { id: "db_name", value: "" }));
    band.appendChild(makeEl("input", { id: "db_email", value: "" }));
    band.appendChild(makeEl("input", { id: "db_zip", value: "" }));
    band.appendChild(makeEl("button", { id: "db_btn", textContent: "Leave your name" }));
    const done = makeEl("div", { id: "db-done", hidden: true });
    sandbox.document.body.appendChild(band);
    sandbox.document.body.appendChild(done);
  } else {
    addWaitlist(sandbox.document, opts.twoStep !== false);
  }
  return {
    sandbox,
    calls,
    cleanup() {
      for (const id of timers) clearTimeout(id);
    },
  };
}

function assertContract(body) {
  for (const key of Object.keys(body)) {
    assert.ok(CC_KEYS.includes(key), "unexpected key " + key);
  }
  assert.equal(body.type, "Waitlist");
  assert.equal(body.source, "Site");
}

function applicationId(notes) {
  const match = String(notes || "").match(/(?:^| \u00B7 )Application: ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?= \u00B7 |$)/i);
  assert.ok(match, "notes missing Application id: " + notes);
  return match[1];
}

test("three fields join the list and step two repeats that id", async () => {
  global.fetch = async function refuse() {
    throw new Error("refusing live network in tests");
  };
  const page = boot();
  try {
    const doc = page.sandbox.document;
    doc.getElementById("w_name").value = "Ada Lovelace";
    doc.getElementById("w_email").value = "ada@example.com";
    doc.getElementById("w_zip").value = "77565";
    doc.getElementById("w_city").value = "Kemah";
    doc.getElementById("w_marina").value = "Watergate";
    doc.getElementById("w_boat").value = "Center console";
    doc.getElementById("w_chest").checked = true;
    page.sandbox.reservePlan("Cavalier");

    await page.sandbox.submitForm("Waitlist");

    assert.equal(page.calls.length, 1);
    const first = page.calls[0];
    assert.equal(first.url, "/.netlify/functions/apply");
    assert.equal(first.method, "POST");
    assert.equal(first.headers["Content-Type"], "application/json");
    assert.equal(String(first.url).includes("n8n"), false);
    assertContract(first.body);
    assert.equal(first.body.name, "Ada Lovelace");
    assert.equal(first.body.email, "ada@example.com");
    assert.equal(first.body.zip, "77565");
    assert.equal(first.body.city, undefined);
    assert.equal(first.body.marinaName, undefined);
    assert.equal(first.body.boatType, undefined);
    assert.equal(first.body.intendedPlan, undefined);
    assert.equal(first.body.notes.includes("Intended plan"), false);
    assert.equal(first.body.notes.includes("Chest:"), false);
    const id = applicationId(first.body.notes);
    assert.equal(first.body.notes, "Application: " + id);
    assert.match(id, UUID);
    assert.equal(doc.getElementById("wait-form-fields").hidden, true);
    assert.equal(doc.getElementById("wait-confirm").hidden, false);
    assert.equal(doc.getElementById("wait-boat").hidden, false);

    await page.sandbox.submitForm("Waitlist", "details");

    assert.equal(page.calls.length, 2);
    const second = page.calls[1];
    assert.equal(second.url, "/.netlify/functions/apply");
    assert.equal(String(second.url).includes("n8n"), false);
    assertContract(second.body);
    assert.equal(second.body.name, "Ada Lovelace");
    assert.equal(second.body.email, "ada@example.com");
    assert.equal(second.body.zip, "77565");
    assert.equal(second.body.city, "Kemah");
    assert.equal(second.body.marinaName, "Watergate");
    assert.equal(second.body.boatType, "Center console");
    assert.equal(second.body.intendedPlan, "Cavalier");
    assert.equal(applicationId(second.body.notes), id);
    assert.equal(second.body.notes, [
      "Application: " + id,
      "Intended plan: Cavalier",
      "Chest: tell me when the Slop Chest opens",
    ].join(" \u00B7 "));
    assert.equal(doc.getElementById("wait-boat").hidden, true);
    assert.equal(doc.getElementById("wait-boat-done").hidden, false);
  } finally {
    page.cleanup();
  }
});

test("a filled honeypot does not post", async () => {
  const page = boot();
  try {
    const doc = page.sandbox.document;
    doc.getElementById("w_name").value = "Ada Lovelace";
    doc.getElementById("w_email").value = "ada@example.com";
    doc.getElementById("w_zip").value = "77565";
    doc.querySelector('[name="company_website"]').value = "spam.example";
    await page.sandbox.submitForm("Waitlist");
    assert.equal(page.calls.length, 0);
  } finally {
    page.cleanup();
  }
});

test("step two before a name does not post", async () => {
  const page = boot();
  try {
    await page.sandbox.submitForm("Waitlist", "details");
    assert.equal(page.calls.length, 0);
    assert.equal(page.sandbox.document.getElementById("w_details_btn").textContent, "Leave your name first");
  } finally {
    page.cleanup();
  }
});

test("the apply hub still sends one full post and no Application token", async () => {
  const page = boot({ twoStep: false });
  try {
    const doc = page.sandbox.document;
    doc.getElementById("w_name").value = "Ada Lovelace";
    doc.getElementById("w_email").value = "ada@example.com";
    doc.getElementById("w_zip").value = "77573";
    doc.getElementById("w_city").value = "League City";
    doc.getElementById("w_marina").value = "Watergate";
    await page.sandbox.submitForm("Waitlist");
    assert.equal(page.calls.length, 1);
    const body = page.calls[0].body;
    assertContract(body);
    assert.equal(body.city, "League City");
    assert.equal(body.marinaName, "Watergate");
    assert.equal(body.boatType, "Sail · cruising");
    assert.equal(body.intendedPlan, "Deckhand");
    assert.equal(String(body.notes || "").includes("Application:"), false);
    assert.equal(body.notes, "Intended plan: Deckhand");
  } finally {
    page.cleanup();
  }
});

test("a shared zip stays on both posts beside the same id", async () => {
  const page = boot({ search: "?z=77565" });
  try {
    const doc = page.sandbox.document;
    doc.getElementById("w_name").value = "Ada Lovelace";
    doc.getElementById("w_email").value = "ada@example.com";
    doc.getElementById("w_zip").value = "77586";
    await page.sandbox.submitForm("Waitlist");
    await page.sandbox.submitForm("Waitlist", "details");
    const first = applicationId(page.calls[0].body.notes);
    const second = applicationId(page.calls[1].body.notes);
    assert.equal(first, second);
    assert.equal(page.calls[0].body.notes, "Application: " + first + " \u00B7 Shared from 77565");
    assert.equal(page.calls[1].body.notes.includes("Shared from 77565"), true);
    assert.equal(page.calls[1].body.notes.includes("Application: " + first), true);
  } finally {
    page.cleanup();
  }
});

test("a browser without randomUUID still reuses one fallback id", async () => {
  const page = boot({ crypto: {} });
  try {
    const doc = page.sandbox.document;
    doc.getElementById("w_name").value = "Ada Lovelace";
    doc.getElementById("w_email").value = "ada@example.com";
    doc.getElementById("w_zip").value = "77565";
    await page.sandbox.submitForm("Waitlist");
    await page.sandbox.submitForm("Waitlist", "details");
    const match = /Application: (cc-[a-z0-9-]+)/.exec(page.calls[0].body.notes);
    assert.ok(match);
    assert.equal(page.calls[1].body.notes.includes("Application: " + match[1]), true);
    assert.equal(page.calls[0].body.notes.includes(match[1]), true);
  } finally {
    page.cleanup();
  }
});

test("an inner-page door does not mint an Application token", async () => {
  const page = boot({ door: true, twoStep: false });
  try {
    const doc = page.sandbox.document;
    doc.getElementById("db_name").value = "Ada Lovelace";
    doc.getElementById("db_email").value = "ada@example.com";
    doc.getElementById("db_zip").value = "77565";
    await page.sandbox.submitForm("Waitlist", "door");
    assert.equal(page.calls.length, 1);
    const body = page.calls[0].body;
    assertContract(body);
    assert.equal(body.notes, "Came from /chest");
    assert.equal(body.city, undefined);
    assert.equal(body.intendedPlan, undefined);
  } finally {
    page.cleanup();
  }
});
