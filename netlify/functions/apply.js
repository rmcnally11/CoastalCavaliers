// Same-origin apply proxy. Browser posts here; n8n URL stays off the page.
// Optional Netlify env: N8N_APPLY_WEBHOOK
const UPSTREAM = process.env.N8N_APPLY_WEBHOOK || "https://rjmrio.app.n8n.cloud/webhook/cc-apply";

const CORS = {
  "Access-Control-Allow-Origin": "https://coastalcavaliers.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "method" };
  }
  try {
    const res = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body || "{}",
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      headers: { ...CORS, "Content-Type": res.headers.get("content-type") || "application/json" },
      body: text,
    };
  } catch (err) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ ok: false }) };
  }
};
