(function () {
  var t = document.querySelector(".nav-toggle");
  var h = document.querySelector("header");
  if (t && h) {
    t.addEventListener("click", function () {
      var open = h.classList.toggle("open");
      t.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var form = document.getElementById("wd-form");
  if (!form) return;
  var err = document.getElementById("wd-err");
  var done = document.getElementById("wd-done");
  var btn = form.querySelector("button[type=submit]");

  function val(id) {
    var e = document.getElementById(id);
    return e && e.value.trim() ? e.value.trim() : undefined;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (err) err.classList.remove("on");
    var marina = val("r_marina");
    var name = val("r_name");
    var email = val("r_email");
    if (!marina || !name || !email) {
      if (err) {
        err.textContent = "Marina, your name, and email — then we can look.";
        err.classList.add("on");
      }
      return;
    }
    var notes = val("r_notes") || "";
    var role = val("r_role");
    notes = ("Waterdog Fuel — invoice review. " + notes).trim();
    if (role) notes += " · Role: " + role;
    var body = {
      type: "Marina",
      source: "Site",
      marinaName: marina,
      business: marina,
      name: name,
      email: email,
      phone: val("r_phone"),
      city: val("r_city"),
      slips: val("r_slips"),
      notes: notes,
    };
    Object.keys(body).forEach(function (k) {
      if (body[k] === undefined || body[k] === "") delete body[k];
    });
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending…";
    }
    fetch("https://rjmrio.app.n8n.cloud/webhook/cc-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("bad");
        form.style.display = "none";
        if (done) done.classList.add("on");
      })
      .catch(function () {
        if (err) {
          err.innerHTML =
            'Could not send from here. Email the invoice to <a href="mailto:orders@coastalcavaliers.com?subject=Waterdog%20Fuel%20%E2%80%94%20marina%20enquiry">orders@coastalcavaliers.com</a>.';
          err.classList.add("on");
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Send the marina";
        }
      });
  });
})();
