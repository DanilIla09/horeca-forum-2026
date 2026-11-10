/* HoReCa Forum 2026 — логика и анимации. Данные: data/event.js (window.EVENT_DATA). */
(function () {
  "use strict";
  var D = window.EVENT_DATA || {};
  var doc = document, root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var initials = function (n) { return String(n || "").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join(""); };
  var get = function (p) { return p.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, D); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  root.classList.add("js");

  /* ---- Простые поля ---- */
  $$("[data-field]").forEach(function (el) { var v = get(el.getAttribute("data-field")); if (v != null) el.textContent = v; });
  $("#navMeta").textContent = [D.dateText, D.timeText, D.venueShort].filter(Boolean).join(" · ");
  $("#aboutEyebrow").textContent = D.about.eyebrow; $("#programEyebrow").textContent = D.program.eyebrow;
  $("#speakersEyebrow").textContent = D.speakers.eyebrow; $("#speakersSub").textContent = D.speakers.sub;
  $("#menuEyebrow").textContent = D.menu.eyebrow; $("#menuNote").textContent = D.menu.note;
  $("#venueEyebrow").textContent = D.venue.eyebrow; $("#orgLabel").textContent = D.footer.organizerLabel; $("#copyright").textContent = D.footer.copyright;

  /* ---- Заголовок hero: слова появляются по очереди, {слово} — золотым курсивом ---- */
  (function () {
    var h = $("#heroTitle"), idx = 0;
    (D.heroTitle || []).forEach(function (line, li) {
      var span = doc.createElement("span"); span.className = "hero__line";
      line.split(/(\{[^}]+\})|\s+/).filter(Boolean).forEach(function (w) {
        var m = w.match(/^\{(.+)\}$/), el = doc.createElement(m ? "em" : "span");
        el.className = "w"; el.style.setProperty("--i", idx++); el.textContent = m ? m[1] : w;
        span.appendChild(el); span.appendChild(doc.createTextNode(" "));
      });
      h.appendChild(span);
    });
  })();

  /* ---- Занавес ---- */
  var curtain = $("#curtain");
  (function () {
    var seen = false;
    try { seen = sessionStorage.getItem("curtainSeen") === "1"; } catch (e) {}
    if (seen || reduced) { curtain.classList.add("is-hidden"); root.classList.add("stage-lit"); return; }
    root.classList.add("curtain-closed");
    setTimeout(function () { curtain.classList.add("is-open"); root.classList.remove("curtain-closed"); root.classList.add("stage-lit"); }, 350);
    setTimeout(function () { curtain.classList.add("is-hidden"); }, 2000);
    try { sessionStorage.setItem("curtainSeen", "1"); } catch (e) {}
  })();

  /* ---- Навигация ---- */
  var nav = $("#nav"), burger = $("#burger");
  var closeNav = function () { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); doc.body.classList.remove("nav-open"); };
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false"); doc.body.classList.toggle("nav-open", open);
  });
  $$("[data-nav]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"), t = id && id.charAt(0) === "#" ? $(id) : null;
      if (!t) return; e.preventDefault(); closeNav();
      t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", id);
    });
  });
  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 24); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var navLinks = $$(".nav__list a"), sections = navLinks.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (!en.isIntersecting) return; navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id); }); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Обратный отсчёт (Алматы, смещение в startsAt) с перелистыванием цифр ---- */
  (function () {
    var start = Date.parse(D.startsAt || ""), end = Date.parse(D.endsAt || "") || start + 6 * 3600e3;
    var cd = $("#countdown"), note = $("#countdownNote"), label = $("#countdownLabel");
    var cells = { d: $("[data-cd=d]"), h: $("[data-cd=h]"), m: $("[data-cd=m]"), s: $("[data-cd=s]") };
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var set = function (el, v) {
      if (el.textContent === v) return;
      el.textContent = v;
      if (reduced) return;
      el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
    };
    function tick() {
      if (isNaN(start)) return;
      var now = Date.now(), diff = start - now;
      if (diff <= 0) {
        set(cells.d, "00"); set(cells.h, "00"); set(cells.m, "00"); set(cells.s, "00");
        cd.classList.add("is-live");
        label.textContent = now < end ? "Занавес поднят" : "Спектакль окончен";
        note.textContent = now < end ? "Форум идёт прямо сейчас" : "Спасибо, что были с нами";
        return;
      }
      var s = Math.floor(diff / 1000);
      set(cells.d, pad(Math.floor(s / 86400))); set(cells.h, pad(Math.floor(s % 86400 / 3600)));
      set(cells.m, pad(Math.floor(s % 3600 / 60))); set(cells.s, pad(s % 60));
    }
    tick(); setInterval(tick, 1000);
  })();

  /* ---- О форуме ---- */
  $("#aboutLead").textContent = D.about.lead;
  var at = $("#aboutText"); (D.about.paragraphs || []).forEach(function (p) { var el = doc.createElement("p"); el.textContent = p; at.appendChild(el); });
  var pl = $("#pillars"); (D.about.pillars || []).forEach(function (p, i) {
    var li = doc.createElement("li"); li.style.setProperty("--i", i);
    li.innerHTML = '<span class="pillars__num">' + esc(p.num) + '</span><h3 class="h3">' + esc(p.title) + '</h3><p>' + esc(p.text) + "</p>"; pl.appendChild(li);
  });

  /* ---- Программа ---- */
  var tl = $("#timeline");
  (D.program.items || []).forEach(function (p, i) {
    var li = doc.createElement("li"); li.className = "tl" + (p.isBreak ? " tl--break" : ""); li.style.setProperty("--i", i);
    li.innerHTML = '<time class="tl__time">' + esc(p.time) + '</time><span class="tl__dot" aria-hidden="true"></span>' +
      '<div class="tl__body"><p class="eyebrow ' + (p.isBreak ? "eyebrow--badge" : "eyebrow--text") + '">' + esc(p.label) + '</p>' +
      '<h3 class="h3">' + esc(p.title) + '</h3>' + (p.meta ? '<p class="tl__meta">' + esc(p.meta) + '</p>' : "") + "</div>";
    tl.appendChild(li);
  });

  /* ---- Спикеры + модалка ---- */
  var grid = $("#speakersGrid"), modal = $("#modal");
  var arch = function (sp, cls, caption) {
    return sp.photo
      ? '<div class="' + cls + '"><img src="' + esc(sp.photo) + '" alt="' + esc(sp.name) + '" loading="lazy"></div>'
      : '<div class="' + cls + ' arch--empty"><b>' + esc(initials(sp.name)) + '</b><span class="eyebrow eyebrow--muted">' + esc(caption || "фото") + "</span></div>";
  };
  (D.speakers.items || []).forEach(function (sp, i) {
    var b = doc.createElement("button"); b.type = "button"; b.className = "speaker"; b.style.setProperty("--i", i);
    b.innerHTML = '<div class="speaker__top">' + arch(sp, "arch") + '<div class="speaker__id"><h3 class="h3">' + esc(sp.name) + '</h3><p class="speaker__role">' + esc(sp.role) + '</p><p class="eyebrow eyebrow--company">' + esc(sp.company) + "</p></div></div>" +
      '<div class="speaker__topic"><p class="eyebrow eyebrow--red">Тема</p><p>' + esc(sp.topic) + '</p></div><span class="speaker__more">Подробнее →</span><span class="speaker__glare" aria-hidden="true"></span>';
    b.addEventListener("click", function () { openModal(sp); });
    if (finePointer && !reduced) tilt(b);
    grid.appendChild(b);
  });
  function tilt(card) {
    var r;
    card.addEventListener("pointerenter", function () { r = card.getBoundingClientRect(); card.classList.add("is-tilting"); });
    card.addEventListener("pointermove", function (e) {
      if (!r) r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg"); card.style.setProperty("--ry", (x * 9).toFixed(2) + "deg");
      card.style.setProperty("--gx", ((x + .5) * 100).toFixed(1) + "%"); card.style.setProperty("--gy", ((y + .5) * 100).toFixed(1) + "%");
    });
    card.addEventListener("pointerleave", function () { card.classList.remove("is-tilting"); card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); r = null; });
  }
  var lastFocus = null;
  function openModal(sp) {
    lastFocus = doc.activeElement;
    $("#modalPhoto").innerHTML = arch(sp, "arch arch--lg");
    $("#modalName").textContent = sp.name || ""; $("#modalRole").textContent = sp.role || ""; $("#modalCompany").textContent = sp.company || "";
    $("#modalTopic").textContent = sp.topic || ""; $("#modalWhen").textContent = [sp.time, sp.stage].filter(Boolean).join(" · ");
    $("#modalBio").textContent = sp.bio || "";
    modal.hidden = false; doc.body.classList.add("modal-open");
    requestAnimationFrame(function () { modal.classList.add("is-open"); $(".modal__close", modal).focus(); });
  }
  function closeModal() {
    modal.classList.remove("is-open"); doc.body.classList.remove("modal-open");
    setTimeout(function () { modal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }, reduced ? 0 : 220);
  }
  $$("[data-close]", modal).forEach(function (el) { el.addEventListener("click", closeModal); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (!modal.hidden) closeModal(); closeNav(); } });

  /* ---- Ведущий ---- */
  var H = D.host || {};
  $("#hostCard").innerHTML = '<div class="poster__frame" aria-hidden="true"></div>' + arch(H, "arch arch--poster", "фото ведущего") +
    '<div class="poster__body"><p class="eyebrow eyebrow--gold">' + esc(H.eyebrow) + '</p><p class="poster__kicker">' + esc(H.kicker) + '</p>' +
    '<h2 class="poster__name" id="hostName">' + esc(H.name).replace(" ", "<br>") + '</h2><p class="poster__text">' + esc(H.description) + '</p>' +
    '<p class="eyebrow eyebrow--gold">' + esc(H.footnote) + "</p></div>";

  /* ---- Меню ---- */
  var mb = $("#menuBody");
  (D.menu.categories || []).forEach(function (c, i) {
    var sec = doc.createElement("section"); sec.className = "menucat"; sec.style.setProperty("--i", i);
    sec.innerHTML = '<h3 class="menucat__title">' + esc(c.category) + "</h3><ul>" + (c.items || []).map(function (it) {
      return "<li><b>" + esc(it.name) + "</b>" + (it.desc ? "<span>" + esc(it.desc) + "</span>" : "") + "</li>";
    }).join("") + "</ul>";
    mb.appendChild(sec);
  });

  /* ---- Локация: карта ---- */
  (function () {
    var V = D.venue || {}, box = $("#venueMap");
    $("#route2gis").href = V.route2gis || "#"; $("#routeGoogle").href = V.routeGoogle || "#";
    var embedded = /claude\.ai$|claudeusercontent\.com$|\.claude\.site$/.test(location.hostname) || location.protocol === "file:" || /\bmap=static\b/.test(location.search);
    var src = V.mapEmbed || (V.mapQuery ? "https://www.google.com/maps?q=" + encodeURIComponent(V.mapQuery) + "&z=15&hl=ru&output=embed" : "");
    if (src && !embedded) {
      var f = doc.createElement("iframe"); f.title = "Карта: место проведения"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade"; f.allowFullscreen = true; f.src = src; box.appendChild(f);
    } else {
      box.classList.add("venue__map--static");
      box.innerHTML = '<div class="map"><span class="map__road map__road--a"></span><span class="map__road map__road--b"></span><span class="map__pin"><i></i></span><span class="map__label">' + esc(V.name || "") + "</span>" +
        '<a class="map__open" href="' + esc(V.routeGoogle || "#") + '" target="_blank" rel="noopener">Открыть карту ↗</a></div>';
    }
  })();

  /* ---- Прожектор за курсором (десктоп) и параллакс кулис ---- */
  var hero = $("#home");
  if (finePointer && !reduced) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  }
  if (!reduced) {
    var wings = $$(".wing"), raf = 0;
    window.addEventListener("scroll", function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; var y = Math.min(window.scrollY, 900); wings.forEach(function (w) { w.style.transform = "translateY(" + (y * .18).toFixed(1) + "px)"; }); });
    }, { passive: true });
  }

  /* ---- Золотая пыль в hero (canvas) ---- */
  (function () {
    var c = $("#dust"); if (!c || reduced) { if (c) c.remove(); return; }
    var ctx = c.getContext("2d"), P = [], W, Hh, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    function size() { var r = hero.getBoundingClientRect(); W = r.width; Hh = r.height; c.width = W * dpr; c.height = Hh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn() { return { x: Math.random() * W, y: Math.random() * Hh, r: .6 + Math.random() * 1.8, vx: (Math.random() - .5) * .12, vy: -.06 - Math.random() * .16, a: Math.random() * Math.PI * 2, s: .004 + Math.random() * .01 }; }
    size(); var n = Math.round(Math.min(90, W * Hh / 14000)); for (var i = 0; i < n; i++) P.push(spawn());
    window.addEventListener("resize", size);
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, Hh);
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.x += p.vx; p.y += p.vy; p.a += p.s;
        if (p.y < -4 || p.x < -4 || p.x > W + 4) { P[i] = spawn(); P[i].y = Hh + 4; continue; }
        var al = .25 + Math.sin(p.a) * .25;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(230,199,110," + al.toFixed(3) + ")"; ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { var v = es[0].isIntersecting && !doc.hidden; if (v && !running) { running = true; frame(); } else if (!v) running = false; }).observe(hero);
    doc.addEventListener("visibilitychange", function () { if (doc.hidden) running = false; else if (!running) { running = true; frame(); } });
  })();

  /* ---- Появление при прокрутке (+ страховка: всё видно через 2,5 с) ---- */
  var reveals = $$(".reveal");
  $$(".hero .reveal").forEach(function (el) { el.classList.add("in"); }); // первый экран не ждёт наблюдателя
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    setTimeout(function () { reveals.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in"); }); }, 2500);
  } else { reveals.forEach(function (el) { el.classList.add("in"); }); }
})();
