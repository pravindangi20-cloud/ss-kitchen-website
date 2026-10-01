/* ===== S.S KITCHEN CENTRE: MAIN.JS =====
   Reads SITE_CONFIG (config.js) and MENU_DATA (menu-data.js). */
(function () {
  "use strict";

  var C = SITE_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===== HELPERS ===== */
  function isReal(v) { return v && v !== "#"; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function money(n) { return n === null ? null : C.currencySymbol + n; }
  function waLink(msg) { return "https://wa.me/" + C.whatsappNumber + "?text=" + encodeURIComponent(msg || C.whatsappMessage); }
  var enc = encodeURIComponent;
  var LINKS = {
    tel: "tel:" + C.phoneTel,
    wa: waLink(),
    dir: "https://www.google.com/maps/dir/?api=1&destination=" + enc(C.mapQuery),
    map: "https://www.google.com/maps/search/?api=1&query=" + enc(C.mapQuery),
    reviews: C.googleReviewsUrl,
    mail: C.email ? "mailto:" + C.email : ""
  };
  var WA_ICON = function (size) {
    return '<svg viewBox="0 0 32 32" width="' + (size || 20) + '" height="' + (size || 20) + '" aria-hidden="true"><path fill="currentColor" d="M16 3C9 3 3.400 8.600 3.400 15.500c0 2.300.6 4.400 1.700 6.300L3 29l7.400-1.900a12.500 12.500 0 0 0 5.600 1.400c7 0 12.600-5.600 12.600-12.500S23 3 16 3zm0 22.900c-1.800 0-3.600-.5-5.100-1.400l-.4-.2-4.400 1.100 1.200-4.300-.3-.4a10 10 0 0 1-1.500-5.300C5.500 9.900 10.200 5.300 16 5.300s10.500 4.600 10.500 10.300S21.800 25.900 16 25.900zm5.800-7.600c-.3-.2-1.900-.9-2.200-1s-.5-.2-.7.200-.8 1-1 1.200-.4.200-.7.100a8.500 8.500 0 0 1-4.200-3.700c-.3-.5.300-.5.900-1.600.1-.2 0-.4 0-.5l-1-2.300c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.100-.8.400s-1 1-1 2.500 1.100 2.900 1.200 3.100 2.100 3.300 5.200 4.600c2 .8 2.800.9 3.800.7.600-.1 1.900-.8 2.200-1.500s.3-1.400.2-1.500-.3-.2-.6-.4z"/></svg>';
  };

  /* ===== CONFIG INJECTION ===== */
  function applyConfig() {
    $$("[data-config]").forEach(function (el) {
      var v = C[el.getAttribute("data-config")];
      if (v) el.textContent = v;
    });
    $$("[data-href]").forEach(function (el) {
      var type = el.getAttribute("data-href");
      var href = LINKS[type];
      if (isReal(href)) { el.setAttribute("href", href); }
      else if (type === "reviews") { el.hidden = true; }   // no real link yet: hide
    });
    $$("[data-icon='wa']").forEach(function (el) { el.innerHTML = WA_ICON(el.getAttribute("data-size")); el.classList.add("icon-inline"); });
    $("#email-box").hidden = !C.email;
    $("#map-frame").src = "https://www.google.com/maps?q=" + enc(C.mapQuery) + "&output=embed";
    $("#year").textContent = new Date().getFullYear();
    $("#dish-count").textContent = MENU_DATA.length;
    // Social icons: hidden when the URL is "#" or empty
    var soc = [["instagramUrl", "IG", "Instagram"], ["facebookUrl", "f", "Facebook"], ["googleReviewsUrl", "G", "Google reviews"]];
    var box = $("#social");
    soc.forEach(function (s) {
      if (!isReal(C[s[0]])) return;
      var a = document.createElement("a");
      a.href = C[s[0]]; a.textContent = s[1]; a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("aria-label", s[2]); box.appendChild(a);
    });
    if (!box.children.length) box.hidden = true;
  }

  /* ===== OPEN NOW (IST, supports overnight ranges) ===== */
  function fmtHour(h) { h = h % 24; return (h % 12 === 0 ? 12 : h % 12) + " " + (h < 12 ? "AM" : "PM"); }
  function updateOpenPill() {
    var pill = $("#open-pill"), txt = $("#open-pill-text");
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var h = +parts.find(function (p) { return p.type === "hour"; }).value % 24;
      var m = +parts.find(function (p) { return p.type === "minute"; }).value;
      var t = h + m / 60, o = C.openHour, c = C.closeHour;
      var open = o < c ? (t >= o && t < c) : (t >= o || t < c);
      pill.classList.toggle("is-open", open); pill.classList.toggle("is-closed", !open);
      txt.textContent = open ? "Open now · till " + fmtHour(c) : "Closed now · opens " + fmtHour(o);
    } catch (e) { pill.hidden = true; }
  }

  /* ===== DIALOG HELPER (focus trap, Esc, restore focus) ===== */
  var openDialogEl = null, lastFocus = null;
  function focusables(el) { return $$("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])", el).filter(function (n) { return !n.hidden && n.offsetParent !== null; }); }
  function openDialog(el) {
    lastFocus = document.activeElement; openDialogEl = el; el.hidden = false;
    document.body.classList.add("is-locked");
    var f = focusables(el); if (f.length) f[0].focus();
  }
  function closeDialog() {
    if (!openDialogEl) return;
    openDialogEl.hidden = true; openDialogEl = null;
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (openDialogEl) closeDialog(); else closeMobile(); }
    if (e.key === "Tab" && openDialogEl) {
      var f = focusables(openDialogEl); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function wireModal(el) { $$("[data-close]", el).forEach(function (b) { b.addEventListener("click", closeDialog); }); }

  /* ===== HEADER, MOBILE MENU, SCROLL ===== */
  var header = $("#header"), burger = $("#hamburger"), mmenu = $("#mobile-menu"), toTop = $("#to-top");
  function openMobile() { mmenu.hidden = false; burger.setAttribute("aria-expanded", "true"); document.body.classList.add("is-locked"); $("#mobile-close").focus(); }
  function closeMobile() { if (mmenu.hidden) return; mmenu.hidden = true; burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("is-locked"); burger.focus(); }
  burger.addEventListener("click", openMobile);
  $("#mobile-close").addEventListener("click", closeMobile);
  $$("a", mmenu).forEach(function (a) { a.addEventListener("click", function () { mmenu.hidden = true; burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("is-locked"); }); });
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    toTop.hidden = y < 600;
  }, { passive: true });
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  // Order modal
  var orderModal = $("#order-modal"); wireModal(orderModal);
  $$("[data-open-order]").forEach(function (b) { b.addEventListener("click", function () { if (!mmenu.hidden) { mmenu.hidden = true; document.body.classList.remove("is-locked"); } openDialog(orderModal); }); });

  /* ===== SCROLL REVEAL + SCROLLSPY ===== */
  if ("IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); rio.unobserve(e.target); } }); }, { threshold: 0.12 });
    $$(".reveal").forEach(function (el) { rio.observe(el); });
    var links = $$(".nav__link");
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    links.forEach(function (l) { var s = $(l.getAttribute("href")); if (s) spy.observe(s); });
  } else { $$(".reveal").forEach(function (el) { el.classList.add("is-visible"); }); }

  /* ===== MOSAIC + LIGHTBOX ===== */
  var PHOTOS = [
    ["Chicken in a yellow bowl", "images/placeholders/mosaic-chicken-yellow-bowl.svg"],
    ["Egg bhurji", "images/placeholders/mosaic-egg-bhurji.svg"],
    ["Egg curry masala", "images/placeholders/mosaic-egg-curry-masala.svg"],
    ["Jeera rice", "images/placeholders/mosaic-jeera-rice.svg"],
    ["Paneer fried rice", "images/placeholders/mosaic-paneer-fried-rice.svg"],
    ["Kadhai paneer", "images/placeholders/mosaic-kadhai-paneer.svg"],
    ["Boiled egg fry", "images/placeholders/mosaic-boiled-egg-fry.svg"],
    ["Boondi chaas", "images/placeholders/mosaic-boondi-chaas.svg"]
  ]; // REPLACE with real photos (same order)
  var TEXTS = ["No filters. No rush. Just food.", "Plates are made for sharing. Seconds are made for you.", "Late night? We're awake.", "Spicy, tangy, and totally worth it."];
  var FLOURISH = ["~ yum ~", "~ share ~", "~ late ~", "~ spicy ~"];
  var textAt = [2, 5, 8, 11], grid = $("#mosaic-grid"), pi = 0, ti = 0;
  for (var i = 0; i < 12; i++) {
    if (textAt.indexOf(i) > -1) {
      var d = document.createElement("div");
      d.className = "tile tile--text " + (ti % 2 === 0 ? "tile--charcoal" : "tile--orange");
      d.innerHTML = '<span class="tile__flourish" aria-hidden="true">' + FLOURISH[ti] + "</span><span>" + esc(TEXTS[ti]) + "</span>";
      grid.appendChild(d); ti++;
    } else {
      var b = document.createElement("button");
      b.type = "button"; b.className = "tile"; b.setAttribute("data-i", pi);
      b.setAttribute("aria-label", "View photo: " + PHOTOS[pi][0]);
      b.innerHTML = '<img src="' + PHOTOS[pi][1] + '" alt="' + esc(PHOTOS[pi][0]) + '" width="600" height="600" loading="lazy"><span class="tile__cap">' + esc(PHOTOS[pi][0]) + "</span>";
      grid.appendChild(b); pi++;
    }
  }
  var lb = $("#lightbox"), lbImg = $("#lb-img"), lbCap = $("#lb-cap"), lbIdx = 0, lbOpener = null;
  function showLb(n) {
    lbIdx = (n + PHOTOS.length) % PHOTOS.length;
    lbImg.src = PHOTOS[lbIdx][1]; lbImg.alt = PHOTOS[lbIdx][0]; lbCap.textContent = PHOTOS[lbIdx][0];
    new Image().src = PHOTOS[(lbIdx + 1) % PHOTOS.length][1]; // preload next
  }
  function openLb(n, opener) { lbOpener = opener; showLb(n); lb.hidden = false; document.body.classList.add("is-locked"); $("#lb-close").focus(); }
  function closeLb() { lb.hidden = true; document.body.classList.remove("is-locked"); if (lbOpener) lbOpener.focus(); }
  grid.addEventListener("click", function (e) { var t = e.target.closest(".tile[data-i]"); if (t) openLb(+t.getAttribute("data-i"), t); });
  $("#lb-close").addEventListener("click", closeLb);
  $("#lb-prev").addEventListener("click", function () { showLb(lbIdx - 1); });
  $("#lb-next").addEventListener("click", function () { showLb(lbIdx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") showLb(lbIdx - 1);
    else if (e.key === "ArrowRight") showLb(lbIdx + 1);
    else if (e.key === "Tab") { var f = [$("#lb-close"), $("#lb-prev"), $("#lb-next")], i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? 2 : 1)) % 3].focus(); }
  });
  var tx = null;
  lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) showLb(lbIdx + (dx < 0 ? 1 : -1)); tx = null; });

  /* ===== MENU ===== */
  var CATS = ["Starters", "Rice & Biryani", "Main Course", "Thalis", "Maggi", "Breads", "Fried Rice", "Sides & Drinks"];
  var state = { tab: "All", q: "", diet: "all", sort: "default" };
  var tabsEl = $("#menu-tabs"), panel = $("#menu-panel"), emptyEl = $("#menu-empty"), countEl = $("#menu-count");
  var searchEl = $("#menu-search"), clearBtn = $("#search-clear");

  ["All"].concat(CATS).forEach(function (name, i) {
    var t = document.createElement("button");
    t.type = "button"; t.className = "tab"; t.setAttribute("role", "tab");
    t.id = "tab-" + slug(name); t.textContent = name; t.setAttribute("data-tab", name);
    t.setAttribute("aria-selected", i === 0 ? "true" : "false"); t.tabIndex = i === 0 ? 0 : -1;
    t.setAttribute("aria-controls", "menu-panel");
    tabsEl.appendChild(t);
  });
  panel.setAttribute("aria-labelledby", "tab-all");

  function setTab(name, opts) {
    opts = opts || {};
    state.tab = name;
    $$(".tab", tabsEl).forEach(function (t) {
      var on = t.getAttribute("data-tab") === name;
      t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      if (on) { panel.setAttribute("aria-labelledby", t.id); if (!opts.noScroll) t.scrollIntoView({ inline: "center", block: "nearest", behavior: reduceMotion ? "auto" : "smooth" }); }
    });
    try { history.replaceState(null, "", name === "All" ? "#menu" : "#menu-" + slug(name)); } catch (e) { /* ignore */ }
    render();
  }
  tabsEl.addEventListener("click", function (e) { var t = e.target.closest(".tab"); if (t) { if (state.q) { searchEl.value = ""; state.q = ""; clearBtn.hidden = true; } setTab(t.getAttribute("data-tab")); } });
  tabsEl.addEventListener("keydown", function (e) {
    var tabs = $$(".tab", tabsEl), i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var n = null;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0; else if (e.key === "End") n = tabs.length - 1;
    if (n !== null) { e.preventDefault(); tabs[n].focus(); tabs[n].click(); }
  });
  // "See on menu" links from the craving cards
  $$(".craving__link").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault(); setTab(a.getAttribute("data-tab"), { noScroll: false });
      $("#menu").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  function priceHTML(p, cls) { return p === null ? '<span class="price price--ask ' + (cls || "") + '">Ask us</span>' : '<span class="price ' + (cls || "") + '">' + money(p) + "</span>"; }
  function dietHTML(d) { return '<span class="dot dot--' + (d === "veg" ? "veg" : "nonveg") + '" aria-hidden="true"></span><span class="sr-only">' + (d === "veg" ? "Vegetarian" : "Non-vegetarian") + "</span>"; }
  function highlight(name) {
    var safe = esc(name);
    if (!state.q) return safe;
    var re = new RegExp("(" + esc(state.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return safe.replace(re, "<mark>$1</mark>");
  }
  function sortItems(arr) {
    if (state.sort === "default") return arr;
    var dir = state.sort === "asc" ? 1 : -1;
    return arr.slice().sort(function (a, b) {
      var pa = a.price === null ? Infinity : a.price, pb = b.price === null ? Infinity : b.price;
      if (pa === pb) return 0; return pa === Infinity ? 1 : pb === Infinity ? -1 : (pa - pb) * dir;
    });
  }
  function dishHTML(it) {
    var photo = it.image ? '<button type="button" class="dish__thumbbtn" data-open="' + it.id + '" aria-label="View details: ' + esc(it.name) + '"><!-- REPLACE with real photo --><img class="dish__thumb" src="' + it.image + '" alt="' + esc(it.name) + '" width="112" height="112" loading="lazy"></button>' : "";
    var cat = state.q ? '<span class="badge">' + esc(it.category) + "</span>" : "";
    var pick = it.chefsPick ? '<span class="pick"><span aria-hidden="true">★</span> Chef\'s Pick</span>' : "";
    var meta = (pick || cat) ? '<div class="dish__meta">' + pick + cat + "</div>" : "";
    return '<article class="dish' + (it.image ? " has-photo" : "") + '"><div class="dish__body"><div class="dish__top">' + dietHTML(it.diet) +
      '<h4 class="dish__name">' + highlight(it.name) + '</h4><span class="dish__leader" aria-hidden="true"></span>' + priceHTML(it.price) + "</div>" +
      (it.description ? '<p class="dish__desc">' + esc(it.description) + "</p>" : "") + meta +
      '<div class="dish__price-mobile">' + priceHTML(it.price) + "</div></div>" + photo +
      '<a class="dish__add" target="_blank" rel="noopener" href="' + waLink("Hi! I'd like to order: " + it.name + (it.price !== null ? " (" + money(it.price) + ")" : "") + ".") + '" aria-label="Order ' + esc(it.name) + ' on WhatsApp" title="Order on WhatsApp">+</a></article>';
  }
  function filtered() {
    var q = state.q.toLowerCase();
    return MENU_DATA.filter(function (it) {
      if (!q && state.tab !== "All" && it.category !== state.tab) return false;
      if (state.diet !== "all" && it.diet !== state.diet) return false;
      if (q && (it.name + " " + it.description).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }
  function render() {
    var items = filtered(), html = "";
    var showCatHeadings = state.tab === "All" || !!state.q;
    CATS.forEach(function (cat) {
      var inCat = items.filter(function (i) { return i.category === cat; });
      if (!inCat.length) return;
      if (showCatHeadings) html += '<div class="menu__cat" id="menu-' + slug(cat) + '"><h3>' + esc(cat) + "</h3>" + (cat === "Thalis" ? '<span class="menu__avail">Subject to availability</span>' : "") + "</div>";
      else if (cat === "Thalis") html += '<div class="menu__cat"><span class="menu__avail">Subject to availability</span></div>';
      var subs = []; inCat.forEach(function (i) { if (subs.indexOf(i.subcategory) < 0) subs.push(i.subcategory); });
      subs.forEach(function (s) {
        var group = sortItems(inCat.filter(function (i) { return i.subcategory === s; }));
        if (s) html += '<h4 class="menu__sub">' + esc(s) + "</h4>";
        html += '<div class="menu__grid">' + group.map(dishHTML).join("") + "</div>";
      });
    });
    panel.innerHTML = html;
    panel.style.animation = "none"; void panel.offsetWidth; panel.style.animation = "";
    emptyEl.hidden = items.length > 0;
    countEl.textContent = "Showing " + items.length + (items.length === 1 ? " dish" : " dishes");
  }

  var deb;
  searchEl.addEventListener("input", function () {
    clearBtn.hidden = !searchEl.value;
    clearTimeout(deb);
    deb = setTimeout(function () {
      state.q = searchEl.value.trim();
      if (state.q && state.tab !== "All") setTab("All", { noScroll: false }); else render();
    }, 150);
  });
  clearBtn.addEventListener("click", function () { searchEl.value = ""; state.q = ""; clearBtn.hidden = true; render(); searchEl.focus(); });
  $$(".diet__btn").forEach(function (b) {
    b.addEventListener("click", function () {
      state.diet = b.getAttribute("data-diet");
      $$(".diet__btn").forEach(function (x) { var on = x === b; x.classList.toggle("is-active", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      render();
    });
  });
  $("#menu-sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
  $("#clear-filters").addEventListener("click", function () {
    searchEl.value = ""; clearBtn.hidden = true; state.q = ""; state.diet = "all"; state.sort = "default"; $("#menu-sort").value = "default";
    $$(".diet__btn").forEach(function (x) { var on = x.getAttribute("data-diet") === "all"; x.classList.toggle("is-active", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    setTab("All", { noScroll: true });
  });

  // Dish detail modal
  var dishModal = $("#dish-modal"); wireModal(dishModal);
  function openDish(id) {
    var it = MENU_DATA.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    var img = $("#dish-modal-img"); img.src = it.image; img.alt = it.name;
    $("#dish-modal-diet").innerHTML = '<span class="badge badge--diet">' + dietHTML(it.diet) + (it.diet === "veg" ? "Veg" : "Non-Veg") + "</span>" + (it.chefsPick ? ' <span class="pick"><span aria-hidden="true">★</span> Chef\'s Pick</span>' : "");
    $("#dish-modal-title").textContent = it.name;
    $("#dish-modal-desc").textContent = it.description;
    $("#dish-modal-price").innerHTML = priceHTML(it.price);
    $("#dish-modal-wa").href = waLink("Hi! I'd like to order: " + it.name + (it.price !== null ? " (" + money(it.price) + ")" : "") + ".");
    openDialog(dishModal);
  }
  panel.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open]");
    if (b) { openDish(b.getAttribute("data-open")); return; }
    var card = e.target.closest(".dish.has-photo");
    if (card && !e.target.closest("a")) { var t = $("[data-open]", card); if (t) openDish(t.getAttribute("data-open")); }
  });

  /* ===== REVIEWS CAROUSEL ===== */
  (function () {
    var car = $("#carousel"), track = $("#carousel-track"), slides = $$(".review", track), dotsBox = $("#carousel-dots"), idx = 0, timer = null, paused = false;
    slides.forEach(function (s, i) {
      var d = document.createElement("button"); d.type = "button"; d.className = "carousel__dot"; d.setAttribute("aria-label", "Go to review " + (i + 1));
      d.addEventListener("click", function () { go(i); }); dotsBox.appendChild(d);
    });
    function go(n) {
      idx = (n + slides.length) % slides.length;
      track.style.transform = "translateX(-" + idx * 100 + "%)";
      $$(".carousel__dot", dotsBox).forEach(function (d, i) { if (i === idx) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
    }
    function start() { if (reduceMotion || timer) return; track.setAttribute("aria-live", "off"); timer = setInterval(function () { if (!paused) go(idx + 1); }, 5000); }
    function stop() { clearInterval(timer); timer = null; track.setAttribute("aria-live", "polite"); }
    $(".carousel__arrow--prev", car).addEventListener("click", function () { go(idx - 1); });
    $(".carousel__arrow--next", car).addEventListener("click", function () { go(idx + 1); });
    car.addEventListener("mouseenter", function () { paused = true; });
    car.addEventListener("mouseleave", function () { paused = false; });
    car.addEventListener("focusin", function () { paused = true; });
    car.addEventListener("focusout", function () { paused = false; });
    car.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") go(idx - 1); if (e.key === "ArrowRight") go(idx + 1); });
    var sx = null;
    car.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; paused = true; }, { passive: true });
    car.addEventListener("touchend", function (e) { if (sx !== null) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); } sx = null; paused = false; });
    go(0); start();
  })();

  /* ===== INIT ===== */
  applyConfig();
  updateOpenPill(); setInterval(updateOpenPill, 60000);
  // Deep link: #menu-thalis etc.
  var h = (location.hash || "").replace("#menu-", "");
  var match = location.hash.indexOf("#menu-") === 0 ? CATS.filter(function (c) { return slug(c) === h; })[0] : null;
  if (match) { setTab(match, { noScroll: true }); setTimeout(function () { $("#menu").scrollIntoView(); }, 50); } else { render(); }
})();
