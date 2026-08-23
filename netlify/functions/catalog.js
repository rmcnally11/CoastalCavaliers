// Same-origin catalog proxy. TEST / demo SKUs never leave this function.
const UPSTREAM = process.env.N8N_CATALOG_WEBHOOK || "https://rjmrio.app.n8n.cloud/webhook/cc-catalog";

const CORS = {
  "Access-Control-Allow-Origin": "https://coastalcavaliers.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function isLiveSku(p) {
  if (!p || typeof p !== "object") return false;
  const sku = String(p.sku || "");
  if (!sku) return false;
  if (/^sku_test_/i.test(sku)) return false;
  if (/^test[_-]/i.test(sku)) return false;
  return true;
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: CORS, body: "method" };
  }
  try {
    const res = await fetch(UPSTREAM, { cache: "no-store" });
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products.filter(isLiveSku) : [];
    const body = {
      note: data.note || "Live catalog. TEST excluded.",
      cluster: data.cluster || {},
      products: products,
    };
    return {
      statusCode: 200,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
      body: JSON.stringify(body),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ note: "No live lines this week.", cluster: {}, products: [] }),
    };
  }
};
