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

  /* ---- Появление при прокрутке (+ страховка: всё видно через 2,5 с). Первый экран ведёт вступление. ---- */
  var reveals = $$(".reveal").filter(function (el) { return !el.closest(".hero"); });
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    setTimeout(function () { reveals.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in"); }); }, 2500);
  } else { reveals.forEach(function (el) { el.classList.add("in"); }); }

  /* ======================================================================
     ВСТУПЛЕНИЕ: тканевый занавес → золотая бутылка взрывается → частицы
     собираются в белую бутылку логотипа → надпись делает оборот на 360°.
     Один раз за сессию; тап по логотипу повторяет взрыв и вращение.
     ====================================================================== */
  (function () {
    var curtain = $("#curtain"), cv = $("#curtainCanvas"), logo = $("#logo3d"), bottleImg = $("#logoBottle"), burstCv = $("#burst");
    var heroReveals = $$(".hero .reveal"), BX = parseFloat(logo.getAttribute("data-bx")) / 100, BY = parseFloat(logo.getAttribute("data-by")) / 100;
    var T_OPEN = 350, T_CHARGE = 1000, T_BURST = 2250;            // мс от старта вступления
    var introDone = false, logoBusy = false, timers = [];
    logo.style.setProperty("--bx", (BX * 100) + "%"); logo.style.setProperty("--by", (BY * 100) + "%");
    logo.style.setProperty("--mask", 'url("' + (bottleImg.currentSrc || bottleImg.src) + '")');
    // отладка: ?slow=8 замедляет всё вступление в 8 раз (и CSS-анимации логотипа)
    var SLOW = Math.max(1, parseFloat((location.search.match(/[?&]slow=([\d.]+)/) || [])[1]) || 1);
    if (SLOW > 1) (function rate() { if (doc.getAnimations) doc.getAnimations().forEach(function (a) { var t = a.effect && a.effect.target; if (t && t.closest && t.closest(".logo3d, .curtain, .hero__inner")) a.playbackRate = 1 / SLOW; }); requestAnimationFrame(rate); })();
    var later = function (fn, ms) { var id = setTimeout(fn, ms * SLOW); timers.push(id); return id; };

    function showRest(delay) {
      heroReveals.forEach(function (el, i) { el.style.transitionDelay = (delay + i * 110) + "ms"; el.classList.add("in"); });
      later(function () { root.classList.add("logo-done"); }, delay);
    }
    function hideCurtain(fade) {
      root.classList.remove("curtain-closed");
      if (!fade) { curtain.classList.add("is-hidden"); return; }
      curtain.classList.add("is-fading"); setTimeout(function () { curtain.classList.add("is-hidden"); }, 650);
    }

    /* ---------- Занавес: складки ткани на canvas ---------- */
    var ctx = cv.getContext("2d"), cw = 0, ch = 0;
    function sizeCurtain() { var d = Math.min(window.devicePixelRatio || 1, 2); cw = window.innerWidth; ch = window.innerHeight; cv.width = cw * d; cv.height = ch * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
    function drawCurtain(t) {            // t — секунды от начала открытия (≤0 — закрыт)
      var W = cw, H = ch, N = W < 640 ? 9 : 14, M = 28, wing = Math.max(16, Math.min(150, W * .09)), half = W / 2 + 1, minW = wing / N;
      var DUR = 1.9, LAG = .34, j, m, y;
      ctx.clearRect(0, 0, W, H);
      // ведущая кромка: низ ткани отстаёт от верха, после остановки затухающе покачивается
      var lead = [];
      for (m = 0; m <= M; m++) {
        var lag = LAG * Math.pow(m / M, 1.4), k = (t - lag) / DUR; k = k < 0 ? 0 : k > 1 ? 1 : k;
        var e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, after = t - lag - DUR;
        var sway = after > 0 ? Math.sin(after * 6.5) * Math.exp(-after * 2.6) * 12 * (m / M) : 0;
        var idle = t <= 0 ? Math.sin(performance.now() / 900 + m * .5) * 1.5 * (m / M) : 0;
        lead.push(half + (wing - half) * e + sway + idle);
      }
      // складки: часть сжимается равномерно, часть «сгребается» кромкой
      var E = [];
      for (j = 0; j <= N; j++) { E.push([]); for (m = 0; m <= M; m++) { var xl = lead[m], uni = j / N * xl, push = Math.min(j / N * half, xl - (N - j) * minW); E[j].push(uni * .45 + push * .55); } }
      for (var side = 0; side < 2; side++) {
        ctx.save(); if (side) { ctx.translate(W, 0); ctx.scale(-1, 1); }
        // каждая складка — столбик из M трапеций со своим градиентом, чтобы объём шёл за изгибом ткани
        for (j = 0; j < N; j++) for (m = 0; m < M; m++) {
          var xa = (E[j][m] + E[j][m + 1]) / 2, xb = (E[j + 1][m] + E[j + 1][m + 1]) / 2, g = ctx.createLinearGradient(xa, 0, Math.max(xb, xa + .5), 0);
          g.addColorStop(0, "#560612"); g.addColorStop(.28, "#a30d25"); g.addColorStop(.5, "#d6243f"); g.addColorStop(.72, "#a30d25"); g.addColorStop(1, "#4a0510");
          ctx.beginPath(); ctx.moveTo(E[j][m], H * m / M); ctx.lineTo(E[j + 1][m] + .6, H * m / M);
          ctx.lineTo(E[j + 1][m + 1] + .6, H * (m + 1) / M + .6); ctx.lineTo(E[j][m + 1], H * (m + 1) / M + .6);
          ctx.closePath(); ctx.fillStyle = g; ctx.fill();
        }
        // общий объём: тень сверху под карнизом и к полу
        ctx.beginPath(); ctx.moveTo(0, 0);
        for (m = 0; m <= M; m++) ctx.lineTo(lead[m], H * m / M);
        ctx.lineTo(0, H); ctx.closePath();
        var vg = ctx.createLinearGradient(0, 0, 0, H);
        vg.addColorStop(0, "rgba(0,0,0,.38)"); vg.addColorStop(.14, "rgba(0,0,0,0)"); vg.addColorStop(.62, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.5)");
        ctx.fillStyle = vg; ctx.fill();
        // золотая кайма по кромке и по подолу
        var gg = ctx.createLinearGradient(0, 0, 0, H); gg.addColorStop(0, "#f3dc94"); gg.addColorStop(.5, "#C9A227"); gg.addColorStop(1, "#7d620f");
        ctx.beginPath(); ctx.moveTo(lead[0], 0); for (m = 1; m <= M; m++) ctx.lineTo(lead[m], H * m / M);
        ctx.strokeStyle = gg; ctx.lineWidth = W < 640 ? 4 : 6; ctx.stroke();
        ctx.fillStyle = "rgba(201,162,39,.9)"; ctx.fillRect(0, H - 7, lead[M], 3); ctx.fillStyle = "rgba(230,199,110,.5)"; ctx.fillRect(0, H - 13, lead[M], 1.5);
        // тень от кромки на сцену
        var sx = lead[M >> 1], sg = ctx.createLinearGradient(sx, 0, sx + 90, 0); sg.addColorStop(0, "rgba(0,0,0,.42)"); sg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.moveTo(lead[0] + 3, 0); for (m = 1; m <= M; m++) ctx.lineTo(lead[m] + 3, H * m / M);
        for (m = M; m >= 0; m--) ctx.lineTo(lead[m] + 93, H * m / M); ctx.closePath(); ctx.fillStyle = sg; ctx.fill();
        ctx.restore();
      }
    }

    /* ---------- Частицы: бутылка разлетается и собирается на месте ---------- */
    var pts = null;
    function samplePoints() {            // точки силуэта бутылки (u, v — доли холста логотипа)
      if (pts) return pts;
      if (!bottleImg.complete || !bottleImg.naturalWidth) return [];
      try {
        var w = 150, h = Math.round(w * 1085 / 1200), oc = doc.createElement("canvas"); oc.width = w; oc.height = h;
        var c2 = oc.getContext("2d"); c2.drawImage(bottleImg, 0, 0, w, h);
        var d = c2.getImageData(0, 0, w, h).data, all = [];
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 120) all.push([(x + .5) / w, (y + .5) / h]);
        if (all.length) pts = all;
        return all;
      } catch (e) { return []; }
      return pts;
    }
    function burst(heroEl) {
      var all = samplePoints(); if (!all.length) return false;
      var r = heroEl.getBoundingClientRect(), L = logo.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      burstCv.width = r.width * d; burstCv.height = r.height * d;
      var c = burstCv.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0);
      var W = L.width, H = L.height, ox = L.left - r.left, oy = L.top - r.top, S = parseFloat(getComputedStyle(logo).getPropertyValue("--S")) || 1.9;
      var cx = ox + W / 2, cy = oy + H / 2, sc = W / 340, K = Math.min(all.length, W < 300 ? 650 : 1000), P = [], F = [], i;
      for (i = 0; i < K; i++) {
        var q = all[(Math.random() * all.length) | 0], u = q[0] + (Math.random() - .5) / 150, v = q[1] + (Math.random() - .5) / 150;
        var sx = cx + S * (u - BX) * W, sy = cy + S * (v - BY) * H, a = Math.atan2(sy - cy, sx - cx) + (Math.random() - .5) * 1.1, sp = (5 + Math.random() * 17) * sc;
        P.push({ x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2 * sc, tx: ox + u * W, ty: oy + v * H, free: .3 + Math.random() * .22, s: (1.3 + Math.random() * 1.9) * Math.max(sc, .8), tw: Math.random() * 6.28 });
      }
      for (i = 0; i < 110; i++) {          // пена и искры, которые улетают
        var a2 = Math.random() * 6.28, sp2 = (3 + Math.random() * 15) * sc, bubble = i < 70;
        F.push({ x: cx + (Math.random() - .5) * 30 * sc, y: cy + (Math.random() - .5) * 90 * sc, vx: Math.cos(a2) * sp2, vy: Math.sin(a2) * sp2 - (bubble ? 3 : 1) * sc, r: bubble ? (2 + Math.random() * 6) * sc : 0, life: .7 + Math.random() * .9, bubble: bubble });
      }
      var t0 = performance.now(), prev = t0;
      (function frame(now) {
        now = now || performance.now(); var T = (now - t0) / 1000 / SLOW, dt = Math.min((now - prev) / 16.67, 3) / SLOW; prev = now;
        c.clearRect(0, 0, r.width, r.height);
        if (T > 1.9) { burstCv.width = burstCv.width; return; }
        var mix = Math.max(0, Math.min(1, (T - .3) / .85)), fade = T < 1.3 ? 1 : Math.max(0, 1 - (T - 1.3) / .45);
        var R = Math.round(230 + 25 * mix), G = Math.round(199 + 56 * mix), B = Math.round(110 + 145 * mix), drag = Math.pow(.925, dt);
        c.globalCompositeOperation = "lighter";
        for (i = 0; i < F.length; i++) {
          var f = F[i]; if (T > f.life) continue; var al = (1 - T / f.life) * .8;
          f.vx *= drag; f.vy = f.vy * drag + (f.bubble ? -.05 : .16) * dt; f.x += f.vx * dt; f.y += f.vy * dt;
          if (f.bubble) { c.beginPath(); c.arc(f.x, f.y, f.r, 0, 6.28); c.strokeStyle = "rgba(255,240,205," + al.toFixed(3) + ")"; c.lineWidth = 1.2; c.stroke(); }
          else { c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x - f.vx * 2.4, f.y - f.vy * 2.4); c.strokeStyle = "rgba(230,199,110," + al.toFixed(3) + ")"; c.lineWidth = 1.6; c.stroke(); }
        }
        c.globalCompositeOperation = "source-over";
        c.fillStyle = "rgba(" + R + "," + G + "," + B + "," + fade.toFixed(3) + ")"; c.beginPath();
        for (i = 0; i < P.length; i++) {
          var p = P[i];
          if (T < p.free) { p.vx *= drag; p.vy = p.vy * drag + .1 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
          else { var k = Math.min(1, (T - p.free) / .8), pull = Math.min(1, (.035 + .34 * k * k) * dt), dx = p.tx - p.x, dy = p.ty - p.y, sw = .07 * (1 - k) * dt; p.x += dx * pull - dy * sw; p.y += dy * pull + dx * sw; }
          var sz = p.s * (1 - .3 * mix) * (.8 + .2 * Math.sin(T * 14 + p.tw));
          c.moveTo(p.x + sz, p.y); c.arc(p.x, p.y, sz, 0, 6.28);
        }
        c.fill();
        requestAnimationFrame(frame);
      })();
      return true;
    }

    /* ---------- Сцена логотипа: зарядка → взрыв → сборка → вращение ---------- */
    function playLogo(chargeMs, onDone) {
      if (logoBusy) return; logoBusy = true;
      var heroEl = $("#home");
      logo.className = "logo3d"; void logo.offsetWidth;
      logo.style.setProperty("--charge", (chargeMs / 1000) + "s"); logo.classList.add("is-charging");
      later(function () {
        logo.classList.remove("is-charging"); logo.classList.add("is-burst");
        heroEl.classList.add("is-shake"); later(function () { heroEl.classList.remove("is-shake"); }, 450);
        var ok = burst(heroEl), landAt = ok ? 1080 : 200;
        later(function () { logo.classList.add("is-spin-in"); }, ok ? 820 : 300);      // надпись: оборот 360°
        later(function () { logo.classList.add("is-bottle-in"); }, landAt);            // бутылка белая, на месте
        later(function () { if (onDone) onDone(); }, landAt + 250);
        later(function () { logo.className = "logo3d is-final"; logoBusy = false; }, landAt + 1700);
      }, chargeMs + 150);
    }
    function spinOnly() {
      if (logoBusy) return; logoBusy = true;
      logo.className = "logo3d is-final"; void logo.offsetWidth; logo.classList.add("is-spin", "is-pulse");
      later(function () { logo.className = "logo3d is-final"; logoBusy = false; }, 1700);
    }
    logo.addEventListener("click", function () { if (!introDone || reduced) return; playLogo(700); });

    /* ---------- Запуск ---------- */
    function finish() {                  // мгновенно в конечное состояние (пропуск, страховка)
      if (introDone) return; introDone = true;
      timers.forEach(clearTimeout); timers = []; logoBusy = false;
      hideCurtain(false); root.classList.add("stage-lit");
      logo.className = "logo3d is-final"; burstCv.width = burstCv.width;
      showRest(0); unbind();
    }
    var skipEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
    function unbind() { skipEvents.forEach(function (ev) { window.removeEventListener(ev, finish); }); }

    var seen = false, force = /\bintro=1\b/.test(location.search);
    try { seen = sessionStorage.getItem("curtainSeen") === "1"; } catch (e) {}
    if (reduced) { finish(); return; }
    if (seen && !force) {                // повторный заход: без занавеса, надпись делает оборот
      introDone = true; hideCurtain(false); root.classList.add("stage-lit"); showRest(0);
      logo.className = "logo3d is-final"; later(spinOnly, 500); return;
    }
    try { sessionStorage.setItem("curtainSeen", "1"); } catch (e) {}
    root.classList.add("curtain-closed"); sizeCurtain(); drawCurtain(0); curtain.classList.add("is-drawn");
    window.addEventListener("resize", sizeCurtain);
    skipEvents.forEach(function (ev) { window.addEventListener(ev, finish, { passive: true }); });
    var start = performance.now(), curtainLive = true;
    (function loop(now) {
      if (!curtainLive || introDone) return;
      var t = (((now || performance.now()) - start) / SLOW - T_OPEN) / 1000; drawCurtain(t);
      if (t > 3.1) { curtainLive = false; hideCurtain(true); return; }
      requestAnimationFrame(loop);
    })();
    later(function () { curtain.classList.add("is-open"); root.classList.add("stage-lit"); }, T_OPEN);
    later(function () { root.classList.remove("curtain-closed"); }, T_OPEN + 1500);
    later(function () {
      playLogo(T_BURST - T_CHARGE - 150, function () { introDone = true; unbind(); showRest(250); });
    }, T_CHARGE);
    setTimeout(finish, 9000 * SLOW);            // страховка: страница всегда приходит в готовый вид
  })();
})();
