/* Coastal Cavaliers member app — lives at /app on coastalcavaliers.com */
(function () {
  const LIVE = "/app/catalog.json";
  const FEE = 0.15;
  const SLIP = 18;
  const STORE = "cc.member-box";
  const FALLBACK = {
    note: "Example box · not a live manifest. WF0 overwrites this file.",
    cluster: { id: "CL-01", name: "Clear Lake / Kemah / Seabrook" },
    products: [],
  };

  const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function chicagoParts(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (t) => parts.find((p) => p.type === t)?.value || "";
    const hourRaw = Number(get("hour"));
    return {
      weekday: get("weekday"),
      year: Number(get("year")),
      month: Number(get("month")),
      day: Number(get("day")),
      hour: hourRaw === 24 ? 0 : hourRaw,
      minute: Number(get("minute")),
    };
  }
  function addDays(y, m, d, n) {
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
  }
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function chicagoWallToUtc(y, m, d, h, min) {
    const guess = Date.UTC(y, m - 1, d, h, min);
    const shown = chicagoParts(new Date(guess));
    const shownMs = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute);
    const wanted = Date.UTC(y, m - 1, d, h, min);
    return new Date(guess + (wanted - shownMs));
  }
  function getCycle(now) {
    now = now || new Date();
    const c = chicagoParts(now);
    const dow = WEEKDAYS[c.weekday] ?? 0;
    const pastCutoff = dow > 3 || (dow === 3 && (c.hour > 12 || (c.hour === 12 && c.minute >= 0)));
    let daysToWed = (3 - dow + 7) % 7;
    if (pastCutoff && daysToWed === 0) daysToWed = 7;
    const cutoffDay = addDays(c.year, c.month, c.day, daysToWed);
    const deliveryDay = addDays(cutoffDay.year, cutoffDay.month, cutoffDay.day, 3);
    const cutoff = chicagoWallToUtc(cutoffDay.year, cutoffDay.month, cutoffDay.day, 12, 0);
    const id = "CL-01-" + deliveryDay.year + "-" + pad(deliveryDay.month) + "-" + pad(deliveryDay.day);
    const cutoffLabel = cutoff.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const deliveryLabel = chicagoWallToUtc(deliveryDay.year, deliveryDay.month, deliveryDay.day, 10, 0).toLocaleString(
      "en-US",
      { timeZone: "America/Chicago", weekday: "long", month: "short", day: "numeric" },
    );
    return {
      id,
      cutoff,
      remainingMs: Math.max(0, cutoff.getTime() - now.getTime()),
      cutoffLabel: "Cutoff " + cutoffLabel + " CT",
      deliveryLabel: "aboard " + deliveryLabel,
      ymd: deliveryDay.year + "-" + pad(deliveryDay.month) + "-" + pad(deliveryDay.day),
    };
  }
  function formatRemaining(ms) {
    if (ms <= 0) return "Cutoff passed";
    const totalMin = Math.floor(ms / 60000);
    const d = Math.floor(totalMin / (60 * 24));
    const h = Math.floor((totalMin - d * 60 * 24) / 60);
    const m = totalMin % 60;
    if (d > 0) return d + "d " + h + "h " + m + "m to Wednesday noon";
    if (h > 0) return h + "h " + m + "m to Wednesday noon";
    return m + "m to Wednesday noon";
  }
  function money(n) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  function stampClass(s) {
    if (!s) return "";
    const x = s.toLowerCase();
    if (x.includes("home")) return "s-home";
    if (x.includes("own")) return "s-own";
    return "s-lic";
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "{}");
    } catch {
      return {};
    }
  }
  function saveState(s) {
    localStorage.setItem(STORE, JSON.stringify(s));
  }

  const state = Object.assign(
    { lines: {}, drop: "saturday-handover", name: "", marina: "", slip: "", lastHold: null, cycleId: "", filter: "all", locked: null },
    loadState(),
  );

  let catalog = FALLBACK;
  let cycle = getCycle();

  function persist() {
    saveState({
      lines: state.lines,
      drop: state.drop,
      name: state.name,
      marina: state.marina,
      slip: state.slip,
      lastHold: state.lastHold,
      cycleId: state.cycleId,
    });
  }

  function path() {
    const p = location.pathname.replace(/\/+$/, "") || "/app";
    return p;
  }
  function go(to, ev) {
    if (ev) ev.preventDefault();
    if (to === path()) {
      render();
      return;
    }
    history.pushState({}, "", to);
    render();
    window.scrollTo(0, 0);
  }
  window.addEventListener("popstate", render);

  function lineList() {
    return Object.values(state.lines).filter((l) => l.qty > 0);
  }
  function totals() {
    const lines = lineList();
    const goods = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const fee = Math.round(goods * FEE * 100) / 100;
    const slipFee = lines.length ? SLIP : 0;
    return { goods, fee, slipFee, total: Math.round((goods + fee + slipFee) * 100) / 100, count: lines.reduce((n, l) => n + l.qty, 0) };
  }
  function add(sku) {
    const p = catalog.products.find((x) => x.sku === sku);
    if (!p) return;
    const cur = state.lines[sku];
    const qty = Math.min(p.capRemaining, (cur ? cur.qty : 0) + 1);
    state.lines[sku] = {
      sku: p.sku,
      name: p.name,
      maker: p.maker,
      port: p.port,
      price: p.price,
      qty,
      variantId: p.variantId,
      stamp: p.stamp,
      cold: p.cold,
    };
    persist();
    render();
  }
  function setQty(sku, qty) {
    if (qty <= 0) delete state.lines[sku];
    else if (state.lines[sku]) state.lines[sku].qty = qty;
    persist();
    render();
  }

  function productRow(p) {
    const qty = state.lines[p.sku] ? state.lines[p.sku].qty : 0;
    const stamps =
      (p.stamp ? '<span class="stamp ' + stampClass(p.stamp) + '">' + p.stamp + "</span>" : "") +
      (p.cold ? '<span class="stamp s-home">Keep cold</span>' : "");
    const drop = p.drop
      ? '<div style="margin-top:4px;font-size:11px;letter-spacing:.04em;color:var(--coral)">Drop · ' +
        p.drop.unitsLeft +
        " of " +
        p.drop.unitsTotal +
        " left</div>"
      : "";
    const ctrl =
      qty === 0
        ? '<button class="btn sm" data-add="' + p.sku + '">Add</button>'
        : '<div class="qty"><button data-dec="' +
          p.sku +
          '">−</button><span>' +
          qty +
          '</span><button data-add="' +
          p.sku +
          '"' +
          (qty >= p.capRemaining ? " disabled" : "") +
          ">+</button></div>";
    return (
      '<article class="row"><div><div class="name">' +
      p.name +
      '</div><div class="mk">' +
      p.maker +
      " · " +
      p.port +
      stamps +
      "</div>" +
      drop +
      '</div><div style="text-align:right"><div class="p">' +
      money(p.price) +
      "</div><div style=\"margin-top:8px\">" +
      ctrl +
      "</div></div></article>"
    );
  }

  function totalsCard() {
    const t = totals();
    return (
      '<div class="totals"><div class="pad"><div class="tline"><span>Goods (makers’ prices)</span><span>' +
      money(t.goods) +
      '</span></div><div class="tline"><span>Provisioning fee 15%</span><span>' +
      money(t.fee) +
      '</span></div><div class="tline"><span>Slip delivery</span><span>' +
      money(t.slipFee) +
      '</span></div><div class="tline tot"><span>Hold total</span><span>' +
      money(t.total) +
      '</span></div></div><p class="legal">Not billed. The app never takes a card. Stripe lives on the website, later.</p></div>'
    );
  }

  function viewThisWeek() {
    return (
      '<p class="kick">Club catalog · holds only · nothing billed</p><h1>This week aboard.</h1><p class="lede">The box the club catalog is publishing. Build a hold against Wednesday noon — Friday staging or Saturday handover. The app does not take a card.</p>' +
      (catalog.note ? '<p class="note">' + catalog.note + "</p>" : "") +
      '<div class="actions" style="margin-top:20px"><button class="btn line" data-pick="1">Captain’s pick</button><button class="btn line" data-last="1"' +
      (state.lastHold ? "" : " disabled") +
      ">Last box</button></div>" +
      '<div class="sec-h"><h2>This week aboard</h2><span>' +
      (catalog.cluster && catalog.cluster.name ? catalog.cluster.name : "CL-01") +
      "</span></div>" +
      catalog.products.map(productRow).join("") +
      '<p class="note" style="margin-top:16px"><span class="swatch"></span>Every box goes out in Gulf Sunrise.</p>' +
      '<div class="actions"><a class="btn" href="/app/box">Review the box →</a><a class="btn line" href="/app/catalog">Full catalog →</a></div>'
    );
  }

  function viewCatalog() {
    const ports = [];
    catalog.products.forEach((p) => {
      if (ports.indexOf(p.port) === -1) ports.push(p.port);
    });
    const chips = [{ id: "all", label: "All ports" }, { id: "bestsellers", label: "Bestsellers" }].concat(
      ports.map((p) => ({ id: p, label: p })),
    );
    const shown = catalog.products.filter((p) => {
      if (state.filter === "all") return true;
      if (state.filter === "bestsellers") return p.bestseller;
      return p.port === state.filter;
    });
    return (
      '<p class="kick">Taste where you are.</p><h1>The catalog.</h1><p class="lede">Example lines until the galley overwrites the catalog. Nothing ships.</p>' +
      '<div class="chips">' +
      chips
        .map(
          (c) =>
            '<button data-filter="' +
            c.id +
            '" class="' +
            (state.filter === c.id ? "on" : "") +
            '">' +
            c.label +
            "</button>",
        )
        .join("") +
      "</div>" +
      (shown.length ? shown.map(productRow).join("") : '<p class="lede">Nothing on that water this week.</p>')
    );
  }

  function viewBox() {
    const lines = lineList();
    const rows = lines.length
      ? lines
          .map((l) => {
            return (
              '<div class="row"><div><div class="name">' +
              l.name +
              '</div><div class="mk">' +
              l.maker +
              " · " +
              l.port +
              (l.stamp ? '<span class="stamp ' + stampClass(l.stamp) + '">' + l.stamp + "</span>" : "") +
              '</div></div><div style="text-align:right"><div class="p">' +
              money(l.price * l.qty) +
              '</div><div class="qty" style="margin-top:8px;justify-content:flex-end"><button data-dec="' +
              l.sku +
              '">−</button><span>' +
              l.qty +
              '</span><button data-add="' +
              l.sku +
              '">+</button></div></div></div>'
            );
          })
          .join("")
      : '<p class="lede">Empty. The catalog is next door, or take the captain’s pick from This week.</p>';
    return (
      '<p class="kick">Makers’ prices, printed.</p><h1>The box.</h1>' +
      rows +
      '<h2 style="margin-top:32px;font-size:22px">The drop</h2><p class="note">Friday staging · Saturday delivery</p>' +
      '<div class="drop"><button data-drop="friday-staging" class="' +
      (state.drop === "friday-staging" ? "on" : "") +
      '">Friday staging<small>Packed, waiting at the dock</small></button><button data-drop="saturday-handover" class="' +
      (state.drop === "saturday-handover" ? "on" : "") +
      '">Saturday handover<small>Aboard before you leave</small></button></div>' +
      '<h2 style="margin-top:32px;font-size:22px">Your slip</h2><div class="fields"><label><span>Name</span><input id="f-name" autocomplete="name" value="' +
      (state.name || "") +
      '"></label><label><span>Marina</span><input id="f-marina" placeholder="Watergate" value="' +
      (state.marina || "") +
      '"></label><label><span>Slip</span><input id="f-slip" placeholder="C-14" value="' +
      (state.slip || "") +
      '"></label></div>' +
      totalsCard() +
      (state.locked
        ? '<div class="ok">Hold locked for ' + state.locked + ". Nothing billed. The galley will see it when we open the route.</div>"
        : "") +
      '<div class="actions"><button class="btn" data-lock="1"' +
      (lines.length ? "" : " disabled") +
      '>Lock this box</button><a class="btn line" href="/app/catalog">Add more</a><a class="btn line" href="/app/install">Put it on the phone</a></div>'
    );
  }

  function viewInstall() {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || Boolean(navigator.standalone);
    return (
      '<p class="kick">On this website · on your phone</p><h1>Get the app<br><em style="font-style:italic;color:var(--coral)">without a weird website.</em></h1>' +
      '<p class="lede">This is the Coastal Cavaliers member app. It lives at coastalcavaliers.com/app — the same club site, not a side URL. Put the icon on your home screen today. The App Store listing is the next step, not a different product.</p>' +
      (standalone
        ? '<div class="ok">Running as an installed app. You are already on the home screen.</div>'
        : "") +
      '<div class="step"><div class="kick">iPhone</div><h2>Add to Home Screen</h2><p>Open <strong>coastalcavaliers.com/app</strong> in Safari. Tap the Share button, then <strong>Add to Home Screen</strong>. The Cavaliers icon sits next to your other apps. Full screen. Same website.</p></div>' +
      '<div class="step"><div class="kick">Android</div><h2>Install app</h2><p>Chrome will offer Install app, or use the menu → Add to Home screen. Same address. Same catalog the galley publishes.</p></div>' +
      '<div class="step"><div class="kick">App Store · Play Store</div><h2>That’s the native listing.</h2><p>Apple and Google want a developer account, a privacy policy, screenshots, and a review. The product they would list is this same app — wrapped, not rebuilt on some other domain. Home-screen install is live on the club site. The store listing is paperwork and a wrapper, not a second website.</p></div>'
    );
  }

  function page() {
    const p = path();
    if (p === "/app/catalog") return viewCatalog();
    if (p === "/app/box" || p === "/app/drop") return viewBox();
    if (p === "/app/install") return viewInstall();
    return viewThisWeek();
  }

  function navOn(href) {
    const p = path();
    if (href === "/app") return p === "/app" || p === "/app/";
    return p === href || p.indexOf(href) === 0;
  }

  function render() {
    cycle = getCycle();
    if (state.cycleId && state.cycleId !== cycle.id) {
      state.lines = {};
      state.locked = null;
    }
    state.cycleId = cycle.id;
    const t = totals();
    const root = document.getElementById("app");
    root.innerHTML =
      '<div class="doors"><div class="wrap"><a class="doors-join" href="/#waitlist">Join the club</a><a class="doors-go" href="/app">The app</a></div></div>' +
      '<header class="bar"><div class="wrap"><a class="brand" href="/app"><img src="/assets/img/crest-gold.webp" alt=""><div><div class="n">Coastal Cavaliers</div><div class="t">Local hands, open water</div></div></a></div><div class="wrap cycle"><div class="id">Cycle ' +
      cycle.id +
      '</div><div class="tick" id="tick">' +
      formatRemaining(cycle.remainingMs) +
      '</div><div class="meta">' +
      cycle.cutoffLabel +
      " · " +
      cycle.deliveryLabel +
      "</div></div></header>" +
      "<main class=\"wrap\" id=\"main\">" +
      page() +
      "</main>" +
      '<div class="dock"><nav>' +
      '<a href="/app" class="' +
      (navOn("/app") && path() !== "/app/catalog" && path() !== "/app/box" && path() !== "/app/install" && path() !== "/app/drop" ? "on" : "") +
      '">This week</a>' +
      '<a href="/app/catalog" class="' +
      (navOn("/app/catalog") ? "on" : "") +
      '">Catalog</a>' +
      '<a href="/app/box" class="' +
      (navOn("/app/box") || path() === "/app/drop" ? "on" : "") +
      '">The box' +
      (t.count ? '<span class="badge">' + t.count + "</span>" : "") +
      "</a>" +
      '<a href="/app/install" class="' +
      (navOn("/app/install") ? "on" : "") +
      '">Install</a>' +
      "</nav></div>";

    root.querySelectorAll("a[href^='/app']").forEach((a) => {
      a.addEventListener("click", (e) => go(a.getAttribute("href"), e));
    });
    root.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => add(b.getAttribute("data-add"))));
    root.querySelectorAll("[data-dec]").forEach((b) => {
      b.addEventListener("click", () => {
        const sku = b.getAttribute("data-dec");
        const cur = state.lines[sku] ? state.lines[sku].qty : 0;
        setQty(sku, cur - 1);
      });
    });
    root.querySelectorAll("[data-filter]").forEach((b) =>
      b.addEventListener("click", () => {
        state.filter = b.getAttribute("data-filter");
        render();
      }),
    );
    root.querySelectorAll("[data-drop]").forEach((b) =>
      b.addEventListener("click", () => {
        state.drop = b.getAttribute("data-drop");
        persist();
        render();
      }),
    );
    const pick = root.querySelector("[data-pick]");
    if (pick)
      pick.addEventListener("click", () => {
        const picks = catalog.products.filter((p) => p.bestseller);
        (picks.length ? picks : catalog.products).forEach((p) => {
          if (!state.lines[p.sku]) add(p.sku);
        });
      });
    const last = root.querySelector("[data-last]");
    if (last)
      last.addEventListener("click", () => {
        if (!state.lastHold) return;
        state.lastHold.lines.forEach((l) => {
          const p = catalog.products.find((x) => x.sku === l.sku);
          if (!p) return;
          state.lines[l.sku] = Object.assign({}, l, { qty: Math.min(l.qty, p.capRemaining), price: p.price });
        });
        state.drop = state.lastHold.drop || state.drop;
        persist();
        go("/app/box");
      });
    const lock = root.querySelector("[data-lock]");
    if (lock)
      lock.addEventListener("click", () => {
        const lines = lineList();
        if (!lines.length) return;
        const t2 = totals();
        const hold = {
          source: "App",
          cluster: "CL-01",
          cycleId: cycle.id,
          cutoffAt: cycle.cutoff.toISOString(),
          deliveryDate: cycle.ymd,
          drop: state.drop,
          slip: state.slip,
          marina: state.marina,
          name: state.name,
          lines,
          goods: t2.goods,
          fee: t2.fee,
          slipFee: t2.slipFee,
          total: t2.total,
          lockedAt: new Date().toISOString(),
          billed: false,
        };
        state.lastHold = hold;
        state.locked = hold.cycleId;
        persist();
        render();
      });
    ["name", "marina", "slip"].forEach((k) => {
      const el = document.getElementById("f-" + k);
      if (!el) return;
      el.addEventListener("input", () => {
        state[k] = el.value;
        persist();
      });
    });
  }

  async function boot() {
    try {
      const res = await fetch(LIVE, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data && data.products && data.products.length) catalog = data;
      }
    } catch (e) {
      /* bundled fallback */
    }
    if (!catalog.products || !catalog.products.length) {
      try {
        const bundled = await fetch("/app/catalog.json", { cache: "no-store" });
        if (bundled.ok) catalog = await bundled.json();
      } catch (e) {}
    }
    render();
    setInterval(() => {
      const tick = document.getElementById("tick");
      cycle = getCycle();
      if (tick) tick.textContent = formatRemaining(cycle.remainingMs);
    }, 30000);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/app/sw.js", { scope: "/app/" }).catch(function () {});
  }
  boot();
})();
