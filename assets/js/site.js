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
function siteSource(){
  var p = (location.pathname || "/").toLowerCase();
  p = p.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  p = p.replace(/\/+$/, "") || "/";
  if (p === "/") return "Site homepage";
  if (p === "/waitlist") return "Site /waitlist";
  if (p === "/makers") return "Site /makers";
  if (p === "/marinas") return "Site /marinas";
  if (p === "/apply") return "Site /apply";
  return "Site";
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
/* forms — same field names as apply.html; omit empty; only read inputs that exist */
function payload(type){
var b = { type: type, source: siteSource() };
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
return b;
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
Marina:   "Received \u2014 we will call \u2713",
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
function submitForm(type){
if (ccBotCheck()) { return; }
var btn = document.getElementById(BTN[type]);
var label = btn.getAttribute("data-l") || btn.textContent;
btn.setAttribute("data-l", label);
var b = payload(type);
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
FIELDS[type].forEach(function(id){
  var e=document.getElementById(id);
  if(!e) return;
  if(e.type === "checkbox") e.checked = false;
  else e.value="";
});
if(type === "Marina"){
  var store = document.getElementById("r_store");
  if(store) store.checked = false;
}
if(type === "Waitlist"){
  var g = document.getElementById("w_plan");
  if(g){ [].forEach.call(g.children, function(c,i){ c.classList.toggle("on", i===0); }); }
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

/* ---- inaugural drop modal -------------------------------------------
   Deliberately does NOT fire on load. The zip capture is the primary
   conversion on this page; a popup over it trades the asset for a sale.
   Fires at 9s or 35% scroll, whichever is first, and never if the visitor
   has already engaged the zip field. Dismissal is permanent.            */
(function(){
  var KEY = "cc_drop_seen_v1";
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
    return mdl.querySelectorAll("a[href],button:not([disabled]),input,[tabindex]:not([tabindex='-1'])");
  }
  function open(){
    if(fired || suppressed) return;
    fired = true;
    lastFocus = document.activeElement;
    mdl.removeAttribute("hidden");
    mdl.style.display = "";
    mdl.classList.add("on");
    document.body.style.overflow = "hidden";
    var f = focusables(); if(f.length) f[f.length-1].focus();
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
  document.getElementById("mdl-later").addEventListener("click", function(){ close(true); });
  document.getElementById("mdl-go").addEventListener("click", function(){ close(true); });
  mdl.addEventListener("click", function(e){ if(e.target === mdl) close(true); });
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

  setTimeout(open, 9000);
  window.addEventListener("scroll", function onScroll(){
    var max = document.body.scrollHeight - window.innerHeight;
    if(max > 0 && (window.scrollY / max) > 0.35){
      window.removeEventListener("scroll", onScroll);
      open();
    }
  }, { passive:true });
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
