// Same-origin Waterdog intake. Writes WD_Operations via n8n.
// Never posts to the club Applications table.
// Optional Netlify env: N8N_WATERDOG_WEBHOOK
const UPSTREAM = process.env.N8N_WATERDOG_WEBHOOK || "https://rjmrio.app.n8n.cloud/webhook/wd-intake";

const CORS = {
  "Access-Control-Allow-Origin": "https://coastalcavaliers.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const KINDS = { Marina: 1, Boat: 1, Talk: 1 };
const BASES = { Houston: 1, Tampa: 1, "Fort Lauderdale": 1, Pensacola: 1, Next: 1 };

function pick(obj) {
  const kind = KINDS[obj && obj.kind] ? obj.kind : null;
  const list = obj && obj.list === "newsletter" ? "newsletter" : undefined;
  if (!kind && !list) return null;
  const base = BASES[obj && obj.base] ? obj.base : undefined;
  const out = {
    kind: kind || "Talk",
    list: list,
    source: "Site",
    name: obj.name || undefined,
    email: obj.email || undefined,
    phone: obj.phone || undefined,
    marina: obj.marina || undefined,
    boatPlace: obj.boatPlace || undefined,
    zip: obj.zip || undefined,
    city: obj.city || undefined,
    slips: obj.slips || undefined,
    notes: obj.notes || undefined,
    base: base,
    pricingType: obj.pricingType || undefined,
    product: obj.product || undefined,
    volumeBand: obj.volumeBand || undefined,
    whenToTalk: obj.whenToTalk || undefined,
  };
  Object.keys(out).forEach(function (k) {
    if (out[k] === undefined || out[k] === "") delete out[k];
  });
  return out;
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "method" };
  }
  let parsed;
  try {
    parsed = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false }) };
  }
  const body = pick(parsed);
  if (!body || !body.email) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false }) };
  }
  try {
    const res = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      headers: { ...CORS, "Content-Type": res.headers.get("content-type") || "application/json" },
      body: text || JSON.stringify({ ok: res.ok }),
    };
  } catch (err) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ ok: false }) };
  }
};
