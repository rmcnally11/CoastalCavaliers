(function () {
  var WEBHOOK = "/.netlify/functions/apply";
  var CC_KEYS = ["type","name","business","marinaName","email","phone","city","zip","makerTier","regNumber","products","capacity","deliveryPref","slips","shipsStore","dropType","boatType","notes","source","intendedPlan"];
  var CC_TYPES = { Maker:1, Marina:1, Waitlist:1 };

  var t = document.querySelector(".nav-toggle");
  var h = document.querySelector("header");
  if (t && h) {
    t.addEventListener("click", function () {
      var open = h.classList.toggle("open");
      t.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var SHEET_KEY = "wd-sheet-v1";

  function val(id) {
    var e = document.getElementById(id);
    return e && e.value.trim() ? e.value.trim() : undefined;
  }
  function parseAmt(v) {
    if (v == null) return NaN;
    var s = String(v).trim();
    if (!s) return NaN;
    var n = parseFloat(s.replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : NaN;
  }
  function num(id) {
    var e = document.getElementById(id);
    return e ? parseAmt(e.value) : NaN;
  }
  function money(n) {
    if (!isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }
  function cents(n) {
    if (!isFinite(n)) return "—";
    return (n * 100).toFixed(1) + "¢";
  }
  function galPrice(n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  function readSheet() {
    try {
      var s = JSON.parse(localStorage.getItem(SHEET_KEY) || "{}");
      return s && typeof s === "object" ? s : {};
    } catch (e) {
      return {};
    }
  }
  // Only real sheet numbers. Omit blanks, placeholders, and uncomputed lines.
  function sheetQuoteParts(s) {
    s = s || {};
    var r = parseAmt(s.rack);
    var p = parseAmt(s.paid);
    var g = parseAmt(s.gal);
    var parts = [];
    if (isFinite(r)) parts.push("Rack " + galPrice(r));
    if (isFinite(p)) parts.push("Delivered " + galPrice(p));
    if (isFinite(g)) parts.push("Gallons " + g.toLocaleString("en-US", { maximumFractionDigits: 0 }));
    if (isFinite(r) && isFinite(p)) {
      var d = p - r;
      parts.push("Differential " + cents(d));
      if (isFinite(g) && g > 0) parts.push("Exposure " + money(d * g));
    }
    return parts;
  }
  function honeypotFilled(form) {
    var hp = form.querySelector('[name="company_website"]');
    return !!(hp && hp.value && hp.value.trim());
  }
  function contractBody(b) {
    var out = {}, i, k, v;
    if (!b || !CC_TYPES[b.type]) return null;
    for (i = 0; i < CC_KEYS.length; i++) {
      k = CC_KEYS[i];
      if (k === "type") { out.type = b.type; continue; }
      if (k === "source") { out.source = "Site"; continue; }
      v = b[k];
      if (v === undefined || v === null || v === "") continue;
      if (k === "shipsStore") { out[k] = !!v; continue; }
      out[k] = v;
    }
    return out;
  }
  function send(body, form, err, done, btn, doneLabel) {
    body = contractBody(body);
    if (!body) {
      if (err) { err.textContent = "Could not send. Email orders@coastalcavaliers.com."; err.classList.add("on"); }
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    function go(n) {
      fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(function (r) {
          if (r.ok) {
            form.style.display = "none";
            if (done) done.classList.add("on");
            return;
          }
          retry(n);
        })
        .catch(function () { retry(n); });
    }
    function retry(n) {
      if (n >= 3) {
        if (err) {
          err.innerHTML = 'Could not send from here. Email <a href="mailto:orders@coastalcavaliers.com?subject=Waterdog%20Fuel">orders@coastalcavaliers.com</a> or call <a href="tel:5612717911">561-271-7911</a>.';
          err.classList.add("on");
        }
        if (btn) { btn.disabled = false; btn.textContent = doneLabel; }
        return;
      }
      setTimeout(function () { go(n + 1); }, 700 * (n + 1));
    }
    go(0);
  }

  var marina = document.getElementById("wd-form");
  if (marina) {
    var notesEl = document.getElementById("r_notes");
    if (notesEl && !notesEl.value.trim()) {
      var sheetParts = sheetQuoteParts(readSheet());
      if (sheetParts.length) notesEl.value = sheetParts.join(" · ");
    }
    marina.addEventListener("submit", function (e) {
      e.preventDefault();
      if (honeypotFilled(marina)) return;
      var err = document.getElementById("wd-err");
      var done = document.getElementById("wd-done");
      var btn = marina.querySelector("button[type=submit]");
      if (err) err.classList.remove("on");
      var m = val("r_marina");
      var name = val("r_name");
      var email = val("r_email");
      if (!m || !name || !email) {
        if (err) { err.textContent = "Marina, your name, and email — then we can look."; err.classList.add("on"); }
        return;
      }
      var notes = "Waterdog Fuel — quote request";
      if (val("r_role")) notes += " · Role: " + val("r_role");
      if (val("r_pricing")) notes += " · Pricing: " + val("r_pricing");
      if (val("r_product")) notes += " · Product: " + val("r_product");
      if (val("r_volume")) notes += " · Volume: " + val("r_volume");
      if (val("r_when")) notes += " · When: " + val("r_when");
      if (val("r_notes")) notes += " · " + val("r_notes");
      send({
        type: "Marina",
        marinaName: m,
        business: m,
        name: name,
        email: email,
        phone: val("r_phone"),
        city: val("r_city"),
        slips: val("r_slips"),
        notes: notes,
      }, marina, err, done, btn, "Request a quote");
    });
  }

  var wait = document.getElementById("wd-wait");
  if (wait) {
    wait.addEventListener("submit", function (e) {
      e.preventDefault();
      if (honeypotFilled(wait)) return;
      var err = document.getElementById("w-err");
      var done = document.getElementById("w-done");
      var btn = wait.querySelector("button[type=submit]");
      if (err) err.classList.remove("on");
      var name = val("w_name");
      var email = val("w_email");
      if (!name || !email) {
        if (err) { err.textContent = "Name and email — that is enough to hold a slip."; err.classList.add("on"); }
        return;
      }
      var parts = ["Waterdog Fuel — wet-hose waitlist"];
      if (val("w_marina")) parts.push("Marina: " + val("w_marina"));
      if (val("w_boat")) parts.push("Boat: " + val("w_boat"));
      if (val("w_notes")) parts.push(val("w_notes"));
      send({
        type: "Waitlist",
        name: name,
        email: email,
        zip: val("w_zip"),
        marinaName: val("w_marina"),
        boatType: val("w_boat"),
        notes: parts.join(" · "),
      }, wait, err, done, btn, "Hold my slip");
    });
  }

  var info = document.getElementById("wd-info");
  if (info) {
    info.addEventListener("submit", function (e) {
      e.preventDefault();
      if (honeypotFilled(info)) return;
      var err = document.getElementById("i-err");
      var done = document.getElementById("i-done");
      var btn = info.querySelector("button[type=submit]");
      if (err) err.classList.remove("on");
      var name = val("i_name");
      var email = val("i_email");
      if (!name || !email) {
        if (err) { err.textContent = "Name and email — that is enough."; err.classList.add("on"); }
        return;
      }
      var kindEl = info.querySelector('input[name="i_kind"]:checked');
      var kind = kindEl ? kindEl.value : "Talk";
      var type = kind === "Marina" ? "Marina" : "Waitlist";
      var notes = (kind === "Marina" ? "Waterdog Fuel — quote request" : "Waterdog Fuel — request more info") + " · " + kind;
      if (val("i_place")) notes += " · Place: " + val("i_place");
      if (val("i_notes")) notes += " · " + val("i_notes");
      send({
        type: type,
        name: name,
        email: email,
        phone: val("i_phone"),
        marinaName: kind === "Marina" ? val("i_place") : undefined,
        business: kind === "Marina" ? val("i_place") : undefined,
        boatType: kind === "Boat" ? val("i_place") : undefined,
        notes: notes,
      }, info, err, done, btn, "Request a quote");
    });
  }

  var rack = document.getElementById("s_rack");
  if (rack) {
    var paid = document.getElementById("s_paid");
    var gal = document.getElementById("s_gal");
    var dOut = document.getElementById("s_diff");
    var eOut = document.getElementById("s_exp");
    var box = document.getElementById("s_verdict");
    function load() {
      var s = readSheet();
      if (s.rack) rack.value = s.rack;
      if (s.paid) paid.value = s.paid;
      if (s.gal) gal.value = s.gal;
    }
    function save() {
      try {
        localStorage.setItem(SHEET_KEY, JSON.stringify({ rack: rack.value, paid: paid.value, gal: gal.value }));
      } catch (e) {}
    }
    function run() {
      save();
      var r = num("s_rack");
      var p = num("s_paid");
      var g = num("s_gal");
      var d = p - r;
      dOut.textContent = isFinite(d) ? cents(d) : "—";
      var exp = d * g;
      eOut.textContent = isFinite(exp) && g > 0 ? money(exp) : "—";
      box.classList.remove("ok", "wide");
      var k = box.querySelector(".k");
      var v = box.querySelector(".v");
      var pEl = box.querySelector("p");
      if (!isFinite(d)) {
        k.textContent = "The differential";
        v.textContent = "Fill the two prices.";
        pEl.textContent = "Rack and delivered price, excluding tax. Freight and surcharge stay in.";
        return;
      }
      var c = d * 100;
      if (c < 12) {
        box.classList.add("ok");
        k.textContent = "Under 12¢";
        v.textContent = "You are buying well.";
        pEl.textContent = "There is nothing here for either of us, and we will say so. Keep the sheet and re-run it next year.";
      } else if (c < 20) {
        k.textContent = "12¢ – 20¢";
        v.textContent = "Normal.";
        pEl.textContent = "Worth a look at volume, but nobody is being taken advantage of.";
      } else if (c < 30) {
        box.classList.add("wide");
        k.textContent = "20¢ – 30¢";
        v.textContent = "Wide.";
        pEl.textContent = "This is where most untested arrangements sit after a few quiet years.";
      } else {
        box.classList.add("wide");
        k.textContent = "Over 30¢";
        v.textContent = "Someone has been comfortable.";
        pEl.textContent = "This is worth a conversation today.";
      }
    }
    load();
    ["input", "change"].forEach(function (ev) {
      rack.addEventListener(ev, run);
      paid.addEventListener(ev, run);
      gal.addEventListener(ev, run);
    });
    run();
  }

  var news = document.getElementById("wd-news");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      if (honeypotFilled(news)) return;
      var err = document.getElementById("n-err");
      var done = document.getElementById("n-done");
      var btn = news.querySelector("button[type=submit]");
      if (err) err.classList.remove("on");
      var email = val("n_email");
      if (!email) {
        if (err) { err.textContent = "Email is enough to subscribe."; err.classList.add("on"); }
        return;
      }
      var name = val("n_name") || email;
      var notes = "Waterdog Fuel — market update subscribe";
      if (val("n_marina")) notes += " · Marina: " + val("n_marina");
      send({
        type: "Waitlist",
        name: name,
        email: email,
        marinaName: val("n_marina"),
        notes: notes,
      }, news, err, done, btn, "Subscribe to market updates");
    });
  }

})();
