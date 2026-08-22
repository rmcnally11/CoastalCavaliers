/* Maker portal — Coastal Cavaliers
   Auth + data go through n8n (see ops/makers/README.md).
   No Airtable keys in the browser.
*/
(function () {
  var AUTH_URL = "https://rjmrio.app.n8n.cloud/webhook/cc-maker-auth";
  var API_URL = "https://rjmrio.app.n8n.cloud/webhook/cc-maker-api";
  var TOKEN_KEY = "cc_maker_token";
  var MAKER_KEY = "cc_maker_profile";

  var $ = function (id) { return document.getElementById(id); };
  var state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    maker: null,
    skus: [],
    payouts: [],
    tab: "week"
  };
  try {
    state.maker = JSON.parse(localStorage.getItem(MAKER_KEY) || "null");
  } catch (e) {
    state.maker = null;
  }

  function show(id, on) {
    var el = $(id);
    if (!el) return;
    el.classList.toggle("hidden", !on);
  }

  function setBanner(msg, warn) {
    var b = $("mp-banner");
    if (!b) return;
    if (!msg) {
      b.classList.add("hidden");
      b.textContent = "";
      return;
    }
    b.classList.remove("hidden");
    b.classList.toggle("warn", !!warn);
    b.innerHTML = msg;
  }

  function renderAuth() {
    var inSession = !!(state.token && state.maker);
    show("mp-login", !inSession);
    show("mp-app", inSession);
    if (inSession) {
      var who = $("mp-who");
      if (who) {
        who.innerHTML = "Signed in as <b>" + escapeHtml(state.maker.business || state.maker.name || "Maker") + "</b>";
      }
      renderTabs();
      renderSkus();
      renderPayouts();
    }
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusBadge(st) {
    var s = (st || "draft").toLowerCase();
    return '<span class="mp-badge ' + s + '">' + escapeHtml(st || "Draft") + "</span>";
  }

  function skuAisle(s) {
    return (s && (s.aisle || s.category)) || "";
  }

  function skuKind(s) {
    return (s && (s.kind || s.name)) || "";
  }

  function resetSkuForm() {
    ["sku_name", "sku_aisle", "sku_kind", "sku_unit", "sku_price", "sku_capacity"].forEach(function (id) {
      if ($(id)) $(id).value = "";
    });
    if ($("sku_photo")) $("sku_photo").value = "";
  }

  function renderTabs() {
    document.querySelectorAll(".mp-tabs button").forEach(function (btn) {
      btn.classList.toggle("on", btn.getAttribute("data-tab") === state.tab);
    });
    show("mp-panel-week", state.tab === "week");
    show("mp-panel-catalog", state.tab === "catalog");
    show("mp-panel-payouts", state.tab === "payouts");
  }

  function renderSkus() {
    var week = $("mp-week-list");
    var cat = $("mp-catalog-list");
    if (!week || !cat) return;

    var live = state.skus.filter(function (s) {
      return (s.status || "").toLowerCase() === "live" || (s.status || "").toLowerCase() === "paused";
    });

    if (!live.length) {
      week.innerHTML = '<div class="mp-empty">No live products yet. Add something under Catalog — it stays <b>Pending</b> until we approve it.</div>';
    } else {
      week.innerHTML = live
        .map(function (s) {
          return (
            '<div class="mp-row" data-id="' +
            escapeHtml(s.sku_id) +
            '"><div><div class="name">' +
            escapeHtml(s.name) +
            "</div><div class=\"meta\">" +
            escapeHtml(s.unit || "") +
            (s.price_cents != null ? " · $" + (Number(s.price_cents) / 100).toFixed(2) : "") +
            "</div></div>" +
            statusBadge(s.status) +
            '<div class="mp-cap"><input type="number" min="0" step="1" value="' +
            escapeHtml(s.capacity != null ? s.capacity : 0) +
            '" aria-label="Capacity for ' +
            escapeHtml(s.name) +
            '" data-cap="' +
            escapeHtml(s.sku_id) +
            '"><button type="button" class="btn line" data-save-cap="' +
            escapeHtml(s.sku_id) +
            '">Save</button></div></div>'
          );
        })
        .join("");
    }

    if (!state.skus.length) {
      cat.innerHTML = '<div class="mp-empty">Nothing here yet. Add your first product — we review before it goes live.</div>';
    } else {
      cat.innerHTML = state.skus
        .map(function (s) {
          return (
            '<div class="mp-row"><div><div class="name">' +
            escapeHtml(s.name) +
            "</div><div class=\"meta\">" +
            escapeHtml(skuKind(s)) +
            (skuAisle(s) ? " · " + escapeHtml(skuAisle(s)) : "") +
            (s.unit ? " · " + escapeHtml(s.unit) : "") +
            "</div></div>" +
            statusBadge(s.status) +
            "<div></div><div></div></div>"
          );
        })
        .join("");
    }
  }

  function renderPayouts() {
    var el = $("mp-payout-list");
    if (!el) return;
    if (!state.payouts.length) {
      el.innerHTML =
        '<div class="mp-empty">Payouts show up here after the first live week. Paid every Friday once orders are real.</div>';
      return;
    }
    el.innerHTML = state.payouts
      .map(function (p) {
        return (
          '<div class="mp-row"><div><div class="name">' +
          escapeHtml(p.cycle || "Cycle") +
          '</div><div class="meta">' +
          escapeHtml(p.status || "") +
          "</div></div><div></div><div></div><div><b>$" +
          (Number(p.amount_cents || 0) / 100).toFixed(2) +
          "</b></div></div>"
        );
      })
      .join("");
  }

  async function post(url, body, token) {
    var headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    var r = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body)
    });
    var data = null;
    try {
      data = await r.json();
    } catch (e) {
      data = null;
    }
    return { ok: r.ok, status: r.status, data: data };
  }

  async function postForm(url, form, token) {
    var headers = {};
    if (token) headers.Authorization = "Bearer " + token;
    var r = await fetch(url, {
      method: "POST",
      headers: headers,
      body: form
    });
    var data = null;
    try {
      data = await r.json();
    } catch (e) {
      data = null;
    }
    return { ok: r.ok, status: r.status, data: data };
  }

  async function refresh() {
    if (!state.token) return;
    setBanner("Loading your desk…");
    var res = await post(API_URL, { action: "list_skus" }, state.token);
    if (!res.ok) {
      setBanner(
        "Portal API is not connected yet (n8n <code>cc-maker-api</code>). UI is ready — wire the webhook from <code>ops/makers</code>.",
        true
      );
      if (!state.skus.length) {
        state.skus = [
          {
            sku_id: "demo_1",
            name: "Banana bread",
            aisle: "Sweet",
            kind: "Banana bread",
            unit: "loaf",
            price_cents: 900,
            status: "Pending",
            capacity: 50
          }
        ];
        renderSkus();
      }
      return;
    }
    state.skus = (res.data && res.data.skus) || [];
    var pay = await post(API_URL, { action: "list_payouts" }, state.token);
    state.payouts = (pay.data && pay.data.payouts) || [];
    setBanner("");
    renderSkus();
    renderPayouts();
  }

  $("mp-start") &&
    ($("mp-start").onclick = async function () {
      var email = ($("mp-email") && $("mp-email").value.trim()) || "";
      var btn = $("mp-start");
      setBanner("");
      if (!email) {
        setBanner("Enter the email you applied with.", true);
        return;
      }
      btn.disabled = true;
      btn.textContent = "Sending…";
      var res = await post(AUTH_URL, { action: "start", email: email });
      btn.disabled = false;
      btn.textContent = "Email me a sign-in code";
      if (!res.ok) {
        setBanner(
          "Auth webhook not live yet. When <code>cc-maker-auth</code> is imported in n8n, this sends a one-time code. For UI review, use <b>Demo sign-in</b>.",
          true
        );
        return;
      }
      setBanner("If you are an approved maker, a code is on its way. Check your email.");
      show("mp-code-wrap", true);
    });

  $("mp-verify") &&
    ($("mp-verify").onclick = async function () {
      var email = ($("mp-email") && $("mp-email").value.trim()) || "";
      var code = ($("mp-code") && $("mp-code").value.trim()) || "";
      var res = await post(AUTH_URL, { action: "verify", email: email, code: code });
      if (!res.ok || !res.data || !res.data.token) {
        setBanner("That code did not work. Try again or request a new one.", true);
        return;
      }
      state.token = res.data.token;
      state.maker = res.data.maker || { name: email, business: email };
      localStorage.setItem(TOKEN_KEY, state.token);
      localStorage.setItem(MAKER_KEY, JSON.stringify(state.maker));
      renderAuth();
      refresh();
    });

  $("mp-demo") &&
    ($("mp-demo").onclick = function () {
      state.token = "demo";
      state.maker = { maker_id: "m_demo", name: "Jerry", business: "Jerry’s Kitchen" };
      state.skus = [
        {
          sku_id: "demo_1",
          name: "Banana bread",
          aisle: "Sweet",
          kind: "Banana bread",
          unit: "loaf",
          price_cents: 900,
          status: "Live",
          capacity: 50
        },
        {
          sku_id: "demo_2",
          name: "Sourdough boule",
          aisle: "Bread",
          kind: "Sourdough boule",
          unit: "loaf",
          price_cents: 900,
          status: "Pending",
          capacity: 40
        }
      ];
      state.payouts = [];
      localStorage.setItem(TOKEN_KEY, state.token);
      localStorage.setItem(MAKER_KEY, JSON.stringify(state.maker));
      setBanner(
        "<b>Demo mode.</b> Capacity edits stay in this browser until n8n + Airtable are wired. Approve flow still lives in Airtable when live."
      );
      renderAuth();
      renderSkus();
      renderPayouts();
    });

  $("mp-signout") &&
    ($("mp-signout").onclick = function () {
      state.token = "";
      state.maker = null;
      state.skus = [];
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(MAKER_KEY);
      setBanner("");
      renderAuth();
    });

  document.querySelectorAll(".mp-tabs button").forEach(function (btn) {
    btn.onclick = function () {
      state.tab = btn.getAttribute("data-tab");
      renderTabs();
    };
  });

  document.addEventListener("click", async function (e) {
    var t = e.target;
    if (!t) return;
    var save = t.getAttribute && t.getAttribute("data-save-cap");
    if (save) {
      var input = document.querySelector('input[data-cap="' + save + '"]');
      var cap = input ? parseInt(input.value, 10) : NaN;
      if (isNaN(cap) || cap < 0) {
        setBanner("Capacity must be a number ≥ 0.", true);
        return;
      }
      var sku = state.skus.find(function (s) {
        return s.sku_id === save;
      });
      if (sku && sku.capacity_sold != null && cap < Number(sku.capacity_sold)) {
        setBanner("Cannot set capacity below what is already sold (" + sku.capacity_sold + ").", true);
        return;
      }
      if (state.token === "demo") {
        if (sku) sku.capacity = cap;
        setBanner("Saved in demo mode: <b>" + escapeHtml(sku && sku.name) + "</b> → " + cap + " this week.");
        renderSkus();
        return;
      }
      t.disabled = true;
      var res = await post(API_URL, { action: "set_capacity", sku_id: save, capacity: cap }, state.token);
      t.disabled = false;
      if (!res.ok) {
        setBanner("Could not save capacity. Try again.", true);
        return;
      }
      if (sku) sku.capacity = cap;
      setBanner("Capacity updated.");
      renderSkus();
    }
  });

  $("mp-add-sku") &&
    ($("mp-add-sku").onclick = async function () {
      var name = ($("sku_name") && $("sku_name").value.trim()) || "";
      var aisle = ($("sku_aisle") && $("sku_aisle").value) || "";
      var kind = ($("sku_kind") && $("sku_kind").value.trim()) || "";
      var unit = ($("sku_unit") && $("sku_unit").value.trim()) || "";
      var price = parseFloat(($("sku_price") && $("sku_price").value) || "");
      var capacity = parseInt(($("sku_capacity") && $("sku_capacity").value) || "0", 10);
      var fileEl = $("sku_photo");
      var file = fileEl && fileEl.files && fileEl.files[0];
      if (!name || !aisle || !kind) {
        setBanner("Name, aisle, and kind are required.", true);
        return;
      }
      if (file && file.size > 8 * 1024 * 1024) {
        setBanner("Photo must be under 8 MB.", true);
        return;
      }
      var sku = {
        name: name,
        aisle: aisle,
        kind: kind,
        unit: unit,
        price_cents: isNaN(price) ? null : Math.round(price * 100),
        capacity: isNaN(capacity) ? 0 : capacity,
        category: aisle
      };
      if (state.token === "demo") {
        var row = {
          sku_id: "local_" + Date.now(),
          name: sku.name,
          aisle: sku.aisle,
          kind: sku.kind,
          unit: sku.unit,
          price_cents: sku.price_cents,
          capacity: sku.capacity,
          status: "Pending"
        };
        state.skus.unshift(row);
        setBanner("Added as <b>Pending</b> (demo). Live ops will require our approval before members see it.");
        resetSkuForm();
        renderSkus();
        return;
      }
      var res;
      if (file) {
        var fd = new FormData();
        fd.append("action", "upsert_sku");
        fd.append("sku", JSON.stringify(sku));
        ["name", "aisle", "kind", "unit", "price_cents", "capacity", "category"].forEach(function (k) {
          if (sku[k] != null && sku[k] !== "") fd.append(k, String(sku[k]));
        });
        fd.append("photo", file, file.name);
        res = await postForm(API_URL, fd, state.token);
      } else {
        res = await post(API_URL, { action: "upsert_sku", sku: sku }, state.token);
      }
      if (!res.ok) {
        setBanner("Could not add product. Check the API webhook.", true);
        return;
      }
      setBanner("Submitted for review.");
      resetSkuForm();
      refresh();
    });

  try {
    var q = new URLSearchParams(location.search);
    var prefill = q.get("email");
    var emailInp = $("mp-email");
    if (prefill && emailInp && !emailInp.value) emailInp.value = prefill;
  } catch (e) {}

  renderAuth();
  if (state.token && state.token !== "demo") refresh();
  else if (state.token === "demo") {
    setBanner("<b>Demo mode</b> — local only until n8n is wired.");
    renderSkus();
    renderPayouts();
  }
})();
