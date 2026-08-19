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
var WEBHOOK = "https://rjmrio.app.n8n.cloud/webhook/cc-apply";
var SERVED = ["77565","77573","77586","77058","77059","77062","77546","77598","77504","77505"];
function val(id){ var e=document.getElementById(id); return e && e.value.trim() ? e.value.trim() : undefined; }
function seg(id){ var e=document.querySelector("#"+id+" .o.on"); return e ? e.dataset.v : undefined; }
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
[].forEach.call(g.children, function(c){ c.classList.remove("on"); });
o.classList.add("on");
});
});
/* FAQ accordion */
document.querySelectorAll(".q h3").forEach(function(h){
h.addEventListener("click", function(){ h.parentElement.classList.toggle("open"); });
});
/* zip check */
function checkZip(){
var z = (document.getElementById("zip").value || "").trim();
var box = document.getElementById("zipres");
if(z.length < 5){ box.className="zipresult in no"; box.innerHTML="Give us five digits and we will tell you straight."; return; }
if(SERVED.indexOf(z) > -1){
box.className = "zipresult in yes";
box.innerHTML = "<b>You are in the first water we open.</b> Leave your name and the plan you have in mind &mdash; we are not taking payment, and you will get the launch date before anyone else. <a href='#waitlist' onclick=\"reservePlan('Cavalier');return false;\" style='color:#163867'>Get on the list &rarr;</a>";
} else {
box.className = "zipresult in no";
box.innerHTML = "<b>Not yet &mdash; but you just moved the map.</b> Tell us where you keep her and we will write when we open your coast. <a href='#w_zip' onclick=\"document.getElementById('w_zip').value='"+z+"';var el=document.getElementById('waitlist')||document.getElementById('w_zip');el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){document.getElementById('w_name').focus()},500);return false;\">Add me to the list &rarr;</a>";
}
}
var zipInput = document.getElementById("zip");
if(zipInput) zipInput.addEventListener("keydown", function(e){ if(e.key === "Enter") checkZip(); });
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
b.makerTier=seg("m_tier"); b.regNumber=val("m_reg"); b.products=val("m_products");
b.capacity=val("m_capacity"); b.deliveryPref=val("m_delivery");
b.notes=val("m_notes");
} else if(type === "Marina"){
b.marinaName=val("r_marina"); b.business=val("r_marina"); b.name=val("r_name");
b.phone=val("r_phone"); b.email=val("r_email"); b.city=val("r_city");
b.slips=val("r_slips"); b.dropType=seg("r_drop");
var store = document.getElementById("r_store");
if(store) b.shipsStore = !!store.checked;
var role = val("r_role"), notes = val("r_notes");
b.notes = role ? (notes ? notes + " \u00b7 Role: " + role : "Role: " + role) : notes;
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
if(parts.length) b.notes = parts.join(" \u00b7 ");
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
Maker:    "Received \u2014 we will be in touch \u2713",
Marina:   "Received \u2014 we will write \u2713",
Waitlist: "You are on the list \u2713"
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
var btn = document.getElementById(src === "boatSnacks" ? "bs_btn" : BTN[type]);
var label = btn.getAttribute("data-l") || btn.textContent;
btn.setAttribute("data-l", label);
var b = payload(type, src);
if(!b) return;
if(type === "Waitlist" && (!b.name || !b.email || !b.zip)){
btn.textContent = "Name, email and zip";
setTimeout(function(){ btn.textContent = label; }, 3000);
return;
}
if(!b.email && !b.phone){
btn.textContent = "Add an email or phone";
setTimeout(function(){ btn.textContent = label; }, 3000);
return;
}
btn.textContent = "Sending\u2026"; btn.disabled = true;
send(b).then(function(ok){
btn.disabled = false;
if(ok){
btn.textContent = DONE[type];
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
btn.textContent = "Did not send \u2014 tap to retry";
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
    [].forEach.call(items, function(el){
      el.hidden = !(cat === "all" || el.getAttribute("data-cat") === cat);
    });
    [].forEach.call(chips, function(b){
      var on = b.getAttribute("data-cat") === cat;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if(empty) empty.hidden = cat !== "womens";
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
