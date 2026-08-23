(function () {
  var WEBHOOK = "/.netlify/functions/waterdog";
  var BASES = { Houston: 1, Tampa: 1, "Fort Lauderdale": 1, Pensacola: 1, Next: 1 };

  var t = document.querySelector(".nav-toggle");
  var h = document.querySelector("header");
  if (t && h) {
    t.addEventListener("click", function () {
      var open = h.classList.toggle("open");
      t.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function val(id) {
    var e = document.getElementById(id);
    return e && e.value.trim() ? e.value.trim() : undefined;
  }
  function honeypotFilled(form) {
    var hp = form.querySelector('[name="company_website"]');
    return !!(hp && hp.value && hp.value.trim());
  }
  function cleanBase(v) {
    return BASES[v] ? v : undefined;
  }
  function send(body, form, err, done, btn, doneLabel) {
    if (!body || !body.email) {
      if (err) { err.textContent = "Could not send. Email orders@coastalcavaliers.com."; err.classList.add("on"); }
      return;
    }
    body.source = "Site";
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
      var base = cleanBase(val("w_base"));
      if (!name || !email || !base) {
        if (err) { err.textContent = "Name, email, and a named base — then we can hold the slip."; err.classList.add("on"); }
        return;
      }
      send({
        kind: "Boat",
        name: name,
        email: email,
        marina: val("w_marina"),
        base: base,
        notes: val("w_notes"),
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
      var base = cleanBase(val("i_base"));
      if (!name || !email || !base) {
        if (err) { err.textContent = "Name, email, and a named base — that is enough."; err.classList.add("on"); }
        return;
      }
      var kindEl = info.querySelector('input[name="i_kind"]:checked');
      var kind = kindEl && { Marina: 1, Boat: 1, Talk: 1 }[kindEl.value] ? kindEl.value : "Talk";
      send({
        kind: kind,
        name: name,
        email: email,
        phone: val("i_phone"),
        marina: kind === "Marina" ? val("i_place") : undefined,
        boatPlace: kind === "Boat" ? val("i_place") : undefined,
        base: base,
        notes: val("i_notes"),
      }, info, err, done, btn, "Send to Waterdog");
    });
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
        if (err) { err.textContent = "Email is enough."; err.classList.add("on"); }
        return;
      }
      send({
        kind: "Talk",
        list: "newsletter",
        name: email,
        email: email,
        base: cleanBase(val("n_base")),
      }, news, err, done, btn, "Add me");
    });
  }
})();
