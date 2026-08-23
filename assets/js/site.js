// One-time cleanup: an earlier build registered a service worker at the root,
// which took control of the whole domain and served stale pages. Remove any
// worker whose scope is not /app/, and bin its caches.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (rs) {
    rs.forEach(function (r) {
      if (r.scope.indexOf('/app/') === -1) {
        r.unregister();
        if (window.caches) { caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); }); }
      }
    });
  }).catch(function () {});
}
var WEBHOOK = "/.netlify/functions/apply";
var SERVED = ["77565","77573","77586","77058","77059","77062","77546","77598","77504","77505"];
function digitsZip(s){ return String(s || "").replace(/\D/g, "").slice(0, 5); }
function liveProducts(list){
  if (!list || !list.length) return [];
  return list.filter(function (p) {
    var sku = String((p && p.sku) || "");
    if (!sku) return false;
    if (/^sku_test_/i.test(sku)) return false;
    if (/^test[_-]/i.test(sku)) return false;
    return true;
  });
}
function showWaitConfirm(body){
  var fields = document.getElementById("wait-form-fields");
  var box = document.getElementById("wait-confirm");
  var title = document.getElementById("wait-confirm-title");
  var copy = document.getElementById("wait-confirm-body");
  if (!box) return false;
  var plan = (body && body.intendedPlan) || "Deckhand";
  var zip = (body && body.zip) || "";
  var first = zip && SERVED.indexOf(zip) > -1;
  var extra = "";
  if (plan === "Cavalier" || plan === "Commodore") {
    extra = " " + plan + " hears first on the founding burgee.";
  }
  if (title) title.textContent = first ? "You are in the first water." : "Your zip is a vote.";
  if (copy) {
    copy.textContent = first
      ? ("Clear Lake, Kemah, Seabrook" + (zip ? " · " + zip : "") + ". We write when this coast opens." + extra)
      : ((zip ? zip + " is on the board. " : "") + "We write when we can open your water." + extra);
  }
  if (fields) fields.hidden = true;
  box.hidden = false;
  box.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
function val(id){ var e=document.getElementById(id); return e && e.value.trim() ? e.value.trim() : undefined; }
function seg(id){ var e=document.querySelector("#"+id+" .o.on"); return e ? e.dataset.v : undefined; }
var CC_AISLES = { Bread:1, Sweet:1, Savory:1, Drink:1, Other:1 };
function selectedAisles(){
  var box = document.getElementById("m_aisles");
  if(!box) return [];
  var out = [];
  [].forEach.call(box.querySelectorAll(".o.on"), function(el){
    var v = el.getAttribute("data-v");
    if(v && CC_AISLES[v]) out.push(v);
  });
  return out;
}
function makerProducts(){
  var text = val("m_products");
  var aisles = selectedAisles();
  if(aisles.length){
    var line = "Aisles: " + aisles.join(", ");
    return text ? line + "\n" + text : line;
  }
  return text;
}
function syncMakerReg(){
  var lab = document.getElementById("m_reg_label");
  var hint = document.getElementById("m_reg_hint");
  var inp = document.getElementById("m_reg");
  var wrap = document.getElementById("m_reg_wrap");
  if(!inp && !lab && !wrap) return;
  var licensed = seg("m_tier") === "Licensed";
  if(wrap){
    wrap.classList.toggle("hidden", !licensed);
    if(inp){
      inp.disabled = !licensed;
      if(!licensed) inp.value = "";
    }
  }
  if(!document.getElementById("m_aisles")) return;
  if(lab) lab.textContent = licensed ? "Licence / establishment number" : "Texas cottage food registration";
  if(hint) hint.textContent = licensed ? "Asked for — licence or establishment number." : "If you have one. Optional for cottage kitchens.";
  if(inp) inp.placeholder = licensed ? "Licence or establishment number" : "If you have one — optional";
}
function clearMakerAisles(){
  var box = document.getElementById("m_aisles");
  if(!box) return;
  [].forEach.call(box.querySelectorAll(".o"), function(el){
    el.classList.remove("on");
    el.setAttribute("aria-pressed", "false");
  });
}
/* Seawall Applications contract. Never send Producer / Marina / Member link IDs. */
var CC_KEYS = ["type","name","business","marinaName","email","phone","city","zip","makerTier","regNumber","products","capacity","deliveryPref","slips","shipsStore","dropType","boatType","notes","source","intendedPlan"];
var CC_TYPES = { Maker:1, Marina:1, Waitlist:1 };
var CC_TIERS = { Cottage:1, Licensed:1, House:1 };
var CC_PLANS = { Deckhand:1, Cavalier:1, Commodore:1 };
function contractBody(b){
  var out = {}, i, k, v;
  if (!b || !CC_TYPES[b.type]) return null;
  for (i=0;i<CC_KEYS.length;i++){
    k = CC_KEYS[i];
    if (k === "type") { out.type = b.type; continue; }
    if (k === "source") { out.source = "Site"; continue; }
    v = b[k];
    if (v === undefined || v === null || v === "") continue;
    if (k === "makerTier" && !CC_TIERS[v]) continue;
    if (k === "intendedPlan" && !CC_PLANS[v]) continue;
    if (k === "shipsStore") { out[k] = !!v; continue; }
    out[k] = v;
  }
  return out;
}
/* segmented controls */
document.querySelectorAll(".seg").forEach(function(g){
g.addEventListener("click", function(e){
var o = e.target.closest(".o"); if(!o) return;
[].forEach.call(g.children, function(c){
  c.classList.remove("on");
  if (c.getAttribute("role") === "radio") c.setAttribute("aria-checked", "false");
});
o.classList.add("on");
if (o.getAttribute("role") === "radio") o.setAttribute("aria-checked", "true");
if(g.id === "m_tier") syncMakerReg();
});
});
var aisleBox = document.getElementById("m_aisles");
if(aisleBox){
  aisleBox.addEventListener("click", function(e){
    var o = e.target.closest(".o");
    if(!o || !aisleBox.contains(o)) return;
    var on = !o.classList.contains("on");
    o.classList.toggle("on", on);
    o.setAttribute("aria-pressed", on ? "true" : "false");
  });
}
syncMakerReg();
/* FAQ accordion */
document.querySelectorAll(".q h3").forEach(function(h){
h.addEventListener("click", function(){ h.parentElement.classList.toggle("open"); });
});
/* zip check */
function checkZip(){
var raw = document.getElementById("zip");
var z = digitsZip(raw && raw.value);
if (raw) raw.value = z;
var box = document.getElementById("zipres");
if(!box) return;
if(z.length < 5){ box.className="zipresult in no"; box.textContent="Give us five digits and we will tell you straight."; return; }
if(SERVED.indexOf(z) > -1){
box.className = "zipresult in yes";
box.innerHTML = "<b>You are in the first water.</b> Clear Lake, Kemah, Seabrook. Leave your name &mdash; you will hear when this coast opens. <a href='#waitlist' class='zip-go' style='color:#163867'>Get on the list &rarr;</a>";
} else {
box.className = "zipresult in no";
box.innerHTML = "<b>Not first-wave yet &mdash; but you just moved the map.</b> Your zip is a vote for the next water. <a href='#waitlist' class='zip-go' style='color:#163867'>Add me to the list &rarr;</a>";
}
var go = box.querySelector(".zip-go");
if (go) go.addEventListener("click", function (e) {
  e.preventDefault();
  var wZip = document.getElementById("w_zip");
  if (wZip) wZip.value = z;
  reservePlan(SERVED.indexOf(z) > -1 ? "Cavalier" : undefined);
});
}
var zipInput = document.getElementById("zip");
if(zipInput){
  zipInput.addEventListener("input", function(){ zipInput.value = digitsZip(zipInput.value); });
  zipInput.addEventListener("keydown", function(e){ if(e.key === "Enter") checkZip(); });
}
function reservePlan(plan){
  var zipEl = document.getElementById("zip");
  var wZip = document.getElementById("w_zip");
  if(zipEl && wZip && zipEl.value.trim()){
    wZip.value = zipEl.value.trim();
  }
  var g = document.getElementById("w_plan");
  if(g && plan){
    [].forEach.call(g.children, function(c){ c.classList.toggle("on", c.getAttribute("data-v") === plan); });
  }
  var target = document.getElementById("waitlist") || document.getElementById("w_name");
  if(target) target.scrollIntoView({behavior:"smooth", block:"start"});
  setTimeout(function(){
    var n = document.getElementById("w_name");
    if(n) n.focus();
  }, 400);
  return false;
}
/* forms — Seawall camelCase only; omit empty; never invent App as source.
   Temporary fallback (not a second capture path): WF2 Shape Application still
   does not map intendedPlan → Intended plan. Keep the intendedPlan key
   (Deckhand / Cavalier / Commodore) AND write "Intended plan: …" into notes
   until n8n adds "Intended plan": s(b.intendedPlan). */
function payload(type, src){
var b = { type: type, source: "Site" };
if(type === "Maker"){
b.name=val("m_name"); b.business=val("m_business"); b.city=val("m_city");
b.zip=val("m_zip"); b.phone=val("m_phone"); b.email=val("m_email");
b.makerTier=seg("m_tier");
var regInp = document.getElementById("m_reg");
if(regInp && !regInp.disabled) b.regNumber=val("m_reg");
b.products=makerProducts();
b.capacity=val("m_capacity"); b.deliveryPref=val("m_delivery");
b.notes=val("m_notes");
} else if(type === "Marina"){
b.marinaName=val("r_marina"); b.business=val("r_marina"); b.name=val("r_name");
b.phone=val("r_phone"); b.email=val("r_email"); b.city=val("r_city");
b.slips=val("r_slips"); b.dropType=seg("r_drop");
var store = document.getElementById("r_store");
if(store) b.shipsStore = !!store.checked;
var role = val("r_role"), notes = val("r_notes");
b.notes = role ? (notes ? notes + " · Role: " + role : "Role: " + role) : notes;
} else if(src === "boatSnacks"){
b.name=val("bs_name"); b.email=val("bs_email"); b.zip=val("bs_zip");
b.notes="Boat Snacks popup";
} else {
b.name=val("w_name"); b.email=val("w_email"); b.zip=val("w_zip");
b.city=val("w_city"); b.marinaName=val("w_marina"); b.boatType=val("w_boat");
b.intendedPlan=seg("w_plan");
var parts = [];
var wNotes = val("w_notes");
if(wNotes) parts.push(wNotes);
if(b.intendedPlan) parts.push("Intended plan: " + b.intendedPlan);
var chest = document.getElementById("w_chest");
if (chest && chest.checked) parts.push("Chest: tell me when the Slop Chest opens");
if(parts.length) b.notes = parts.join(" · ");
}
return contractBody(b);
}
function send(body, tries){
tries = tries || 3;
return new Promise(function(resolve){
function go(n){
fetch(WEBHOOK, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) })
.then(function(r){ r.ok ? resolve(true) : retry(n); })
.catch(function(){ retry(n); });
}
function retry(n){ if(n >= tries) return resolve(false); setTimeout(function(){ go(n+1); }, 700*(n+1)); }
go(0);
});
}
var DONE = {
Maker:    "Received — we will be in touch ✓",
Marina:   "Received — we will write ✓",
Waitlist: "You are on the list ✓"
};
var BTN = { Maker:"m_btn", Marina:"r_btn", Waitlist:"w_btn" };
var FIELDS = {
Maker:["m_name","m_business","m_city","m_zip","m_phone","m_email","m_reg","m_products","m_capacity","m_notes"],
Marina:["r_marina","r_name","r_role","r_phone","r_email","r_city","r_slips","r_notes"],
Waitlist:["w_name","w_email","w_zip","w_city","w_marina","w_notes"]
};
function ccBotCheck(){
var hps = document.querySelectorAll('[name="company_website"]');
for (var i=0;i<hps.length;i++){ if (hps[i].value) return true; }
return false;
}
function submitForm(type, src){
if (ccBotCheck()) { return; }
var btn = document.getElementById(src === "boatSnacks" ? "bs_btn" : BTN[type]) || document.getElementById("submit");
var label = btn.getAttribute("data-l") || btn.textContent;
btn.setAttribute("data-l", label);
var b = payload(type, src);
if(!b) return;
if(type === "Waitlist" && (!b.name || !b.email || !b.zip)){
btn.textContent = "Name, email and zip";
setTimeout(function(){ btn.textContent = label; }, 3000);
return;
}
if(type === "Maker" && (!b.name || !b.email || !b.zip || !val("m_products"))){
btn.textContent = "Name, email, zip and kitchen";
setTimeout(function(){ btn.textContent = label; }, 3000);
return;
}
if(!b.email && !b.phone){
btn.textContent = "Add an email or phone";
setTimeout(function(){ btn.textContent = label; }, 3000);
return;
}
btn.textContent = "Sending…"; btn.disabled = true;
send(b).then(function(ok){
btn.disabled = false;
if(ok){
btn.textContent = DONE[type];
if (type === "Waitlist" && src !== "boatSnacks" && showWaitConfirm(b)) {
  var applyDone = document.getElementById("done");
  if (applyDone && document.getElementById("form-area")) {
    document.getElementById("form-area").classList.add("hidden");
    applyDone.classList.remove("hidden");
    var dp = document.getElementById("done-p");
    if (dp) dp.textContent = DONE.Waitlist;
  }
  return;
}
if (document.getElementById("form-area") && document.getElementById("done")) {
  document.getElementById("form-area").classList.add("hidden");
  document.getElementById("done").classList.remove("hidden");
  var doneP = document.getElementById("done-p");
  if (doneP) doneP.textContent = DONE[type];
  window.scrollTo(0, 0);
  return;
}
var clear = src === "boatSnacks" ? ["bs_name","bs_email","bs_zip"] : FIELDS[type];
clear.forEach(function(id){
  var e=document.getElementById(id);
  if(!e) return;
  if(e.type === "checkbox") e.checked = false;
  else e.value="";
});
if(type === "Marina"){
  var store = document.getElementById("r_store");
  if(store) store.checked = false;
}
if(type === "Maker"){
  clearMakerAisles();
  syncMakerReg();
}
if(type === "Waitlist" && src !== "boatSnacks"){
  var g = document.getElementById("w_plan");
  if(g){ [].forEach.call(g.children, function(c,i){ c.classList.toggle("on", i===0); }); }
}
if(src === "boatSnacks"){
  setTimeout(function(){ document.dispatchEvent(new CustomEvent("cc-mdl-done")); }, 900);
  return;
}
setTimeout(function(){ btn.textContent = label; }, 6000);
} else {
btn.textContent = "Did not send — tap to retry";
setTimeout(function(){ btn.textContent = label; }, 5000);
}
});
}
/* reveal on scroll */
(function(){
var els = document.querySelectorAll(".rv");
if(!("IntersectionObserver" in window)){ [].forEach.call(els, function(e){ e.classList.add("in"); }); return; }
var io = new IntersectionObserver(function(en){
en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add("in"); io.unobserve(x.target); } });
}, { threshold:.1 });
[].forEach.call(els, function(e){ io.observe(e); });
})();

/* ---- Boat Snacks waitlist popup -------------------------------------
   Same #mdl as before — one popup, not a second. First visit, ~1s after
   load, once-per-browser. Does not fire at 0ms. Zip-suppress stays: if
   they are already in the homepage zip field, do not steal focus.
   Dismissal (or a successful waitlist submit) is permanent.             */
(function(){
  var KEY = "cc_boat_snacks_popup_v1";
  var mdl = document.getElementById("mdl");
  if(!mdl) return;
  try { if(localStorage.getItem(KEY)) return; } catch(e){}

  var fired = false, lastFocus = null, suppressed = false;

  var zip = document.getElementById("zip");
  if(zip){
    ["focus","input"].forEach(function(ev){
      zip.addEventListener(ev, function(){ suppressed = true; }, { once:true });
    });
  }

  function focusables(){
    return mdl.querySelectorAll("a[href],button:not([disabled]),input:not([tabindex='-1']),[tabindex]:not([tabindex='-1'])");
  }
  function open(){
    if(fired || suppressed) return;
    if(document.activeElement === zip) return;
    fired = true;
    lastFocus = document.activeElement;
    mdl.removeAttribute("hidden");
    mdl.style.display = "";
    mdl.classList.add("on");
    document.body.style.overflow = "hidden";
    var name = document.getElementById("bs_name");
    if(name) name.focus();
    else { var f = focusables(); if(f.length) f[0].focus(); }
  }
  function close(remember){
    mdl.classList.remove("on");
    mdl.style.display = "none";
    mdl.setAttribute("hidden", "");
    document.body.style.overflow = "";
    if(remember){ try { localStorage.setItem(KEY,"1"); } catch(e){} }
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.getElementById("mdl-x").addEventListener("click", function(){ close(true); });
  mdl.addEventListener("click", function(e){ if(e.target === mdl) close(true); });
  document.addEventListener("cc-mdl-done", function(){ close(true); });
  var form = document.getElementById("mdl-form");
  if(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      submitForm("Waitlist", "boatSnacks");
    });
  }
  document.addEventListener("keydown", function(e){
    if(!mdl.classList.contains("on")) return;
    if(e.key === "Escape"){ close(true); return; }
    if(e.key === "Tab"){
      var f = focusables(); if(!f.length) return;
      var first = f[0], last = f[f.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });

  setTimeout(open, 1000);
})();

(function(){
  try {
    var q = new URLSearchParams(location.search);
    var plan = q.get("plan");
    if(plan && /^(Deckhand|Cavalier|Commodore)$/.test(plan)){
      reservePlan(plan);
    }
  } catch (e) {}
})();

/* public sticky-header menu — desktop nav stays as-is above 1000px */
(function(){
  var header = document.querySelector("header");
  var nav = header && header.querySelector("nav.main");
  var btn = header && header.querySelector(".nav-toggle");
  if(!header || !nav || !btn) return;
  if(!nav.id) nav.id = "main-nav";
  btn.setAttribute("aria-controls", nav.id);

  function narrow(){ return window.matchMedia("(max-width:1000px)").matches; }
  function sync(){
    var open = header.classList.contains("nav-open") && narrow();
    header.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if(!narrow()){
      nav.removeAttribute("hidden");
      nav.removeAttribute("inert");
      return;
    }
    if(open){
      nav.removeAttribute("hidden");
      nav.removeAttribute("inert");
    } else {
      nav.setAttribute("hidden", "");
      nav.setAttribute("inert", "");
    }
  }
  function setOpen(open){
    header.classList.toggle("nav-open", !!open && narrow());
    sync();
  }

  btn.addEventListener("click", function(){
    setOpen(!header.classList.contains("nav-open"));
  });
  document.addEventListener("keydown", function(e){
    if(e.key !== "Escape" || !header.classList.contains("nav-open")) return;
    setOpen(false);
    btn.focus();
  });
  nav.addEventListener("click", function(e){
    if(e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", function(e){
    if(!header.classList.contains("nav-open")) return;
    if(!header.contains(e.target)) setOpen(false);
  });
  window.addEventListener("resize", function(){
    if(!narrow()) setOpen(false);
    else sync();
  });
  sync();
})();

/* Slop Chest category chips. Preview wall only — hide/show signed cards. */
(function(){
  var bar = document.getElementById("chest-filt");
  if(!bar) return;
  var chips = bar.querySelectorAll("button[data-cat]");
  var items = document.querySelectorAll("#chest .item[data-cat]");
  var empty = document.getElementById("chest-empty");
  function show(cat){
    var n = 0;
    [].forEach.call(items, function(el){
      var ok = cat === "all" || el.getAttribute("data-cat") === cat;
      el.hidden = !ok;
      if(ok) n++;
    });
    [].forEach.call(chips, function(b){
      var on = b.getAttribute("data-cat") === cat;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if(empty) empty.hidden = !(cat === "womens" && n === 0);
  }
  bar.addEventListener("click", function(e){
    var b = e.target.closest("button[data-cat]");
    if(!b) return;
    show(b.getAttribute("data-cat"));
  });
  bar.addEventListener("keydown", function(e){
    if(e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var list = [].slice.call(chips);
    var i = list.indexOf(document.activeElement);
    if(i < 0) return;
    e.preventDefault();
    var next = e.key === "ArrowRight" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
    list[next].focus();
    show(list[next].getAttribute("data-cat"));
  });
})();

/* Portal door on /makers — optional email prefill for /makers/portal */
(function(){
  var go = document.getElementById("mp-door-go");
  var email = document.getElementById("mp-door-email");
  if(!go) return;
  function href(){
    var e = email && email.value.trim();
    go.href = e ? "/makers/portal?email=" + encodeURIComponent(e) : "/makers/portal";
  }
  if(email){
    email.addEventListener("input", href);
    email.addEventListener("keydown", function(ev){
      if(ev.key === "Enter"){ ev.preventDefault(); href(); go.click(); }
    });
  }
  href();
})();

/* build js-20260823a */

/* Live catalog — homepage “This week aboard”. Never fall back to the example box. */
(function () {
  var box = document.getElementById("week-box");
  if (!box) return;
  var LIVE = "/.netlify/functions/catalog";
  var rowsEl = document.getElementById("week-box-rows");
  var subEl = document.getElementById("week-box-sub");
  var ledeEl = document.getElementById("week-box-lede");

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function money(n) {
    return (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  function stampClass(s) {
    if (!s) return "";
    var x = String(s).toLowerCase();
    if (x.indexOf("home") !== -1 || x.indexOf("cottage") !== -1) return "s-home";
    if (x.indexOf("own") !== -1) return "s-own";
    return "s-lic";
  }
  function emptyState() {
    if (ledeEl) ledeEl.textContent = "No live lines this week.";
    if (subEl) subEl.textContent = "No live lines this week";
    if (rowsEl) {
      rowsEl.innerHTML =
        '<div class="m-row"><div><div class="n">No live lines this week.</div><div class="mk">The live catalog is empty until a Real Live SKU is on this water.</div></div></div>';
    }
  }
  function renderLive(data) {
    var products = liveProducts(data && data.products ? data.products : []);
    var cluster = data && data.cluster ? data.cluster : {};
    if (!products.length) {
      emptyState();
      if (subEl && cluster.name) subEl.textContent = cluster.name + " · no live lines this week";
      return;
    }
    if (ledeEl) ledeEl.textContent = "Local makers, one slip delivery. The shape is the same on every coast.";
    if (subEl) subEl.textContent = cluster.name || "Live catalog";
    var html = "";
    products.forEach(function (p) {
      var bits = [];
      if (p.maker) bits.push(p.maker);
      if (p.port) bits.push(p.port);
      var stamp = p.stamp
        ? '<span class="stamp ' + stampClass(p.stamp) + '">' + escapeHtml(p.stamp) + "</span>"
        : "";
      html +=
        '<div class="m-row"><div><div class="n">' +
        escapeHtml(p.name || p.kind || p.sku) +
        '</div><div class="mk">' +
        escapeHtml(bits.join(" · ")) +
        stamp +
        "</div></div><div class=\"p\">" +
        money(p.price) +
        "</div></div>";
    });
    if (rowsEl) rowsEl.innerHTML = html;
  }

  emptyState();
  if (subEl) subEl.textContent = "Loading the live catalog";
  if (ledeEl) ledeEl.textContent = "The box this water is publishing. Local makers, one slip delivery.";

  fetch(LIVE, { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("catalog");
      return res.json();
    })
    .then(function (data) {
      if (data && Object.prototype.toString.call(data.products) === "[object Array]") renderLive(data);
      else emptyState();
    })
    .catch(function () {
      emptyState();
    });
})();

/* How it works tabs */
document.querySelectorAll(".how-tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    var key = tab.getAttribute("data-how");
    document.querySelectorAll(".how-tab").forEach(function (t) {
      t.classList.toggle("on", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    document.querySelectorAll(".how-panel").forEach(function (p) {
      var on = p.getAttribute("data-how") === key;
      p.classList.toggle("on", on);
      if (on) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
  });
});

/* apply.html hub — one site.js path, no inline webhook */
(function () {
  var tabs = document.querySelectorAll(".hub-tabs .tab");
  if (!tabs.length) return;
  var current = "Maker";
  function show(type) {
    current = type;
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-t") === type;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".pane").forEach(function (p) {
      p.classList.toggle("hidden", p.getAttribute("data-p") !== type);
    });
    var err = document.getElementById("err");
    if (err) err.innerHTML = "";
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { show(t.getAttribute("data-t")); });
  });
  var btn = document.getElementById("submit");
  if (btn) btn.addEventListener("click", function () { submitForm(current); });
  try {
    var tab = new URLSearchParams(location.search).get("t");
    if (tab && /^(Maker|Marina|Waitlist)$/.test(tab)) show(tab);
  } catch (e) {}
})();
