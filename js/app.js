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
  $("#menuEyebrow").textContent = D.menu.eyebrow; $("#menuTeaser").textContent = D.menu.teaser || "";
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
    li.innerHTML = '<time class="tl__time"><b>' + esc(p.time) + '</b>' + (p.end ? '<span>–' + esc(p.end) + '</span>' : '') + '</time><span class="tl__dot" aria-hidden="true"></span>' +
      '<div class="tl__body"><p class="eyebrow ' + (p.isBreak ? "eyebrow--badge" : "eyebrow--text") + '">' + esc(p.label) + '</p>' +
      '<h3 class="h3">' + esc(p.title) + '</h3>' + (p.meta ? '<p class="tl__meta">' + esc(p.meta) + '</p>' : "") + "</div>";
    tl.appendChild(li);
  });

  /* ---- Спикеры + модалка ---- */
  var grid = $("#speakersGrid"), modal = $("#modal");
  var arch = function (sp, cls, caption) {
    return sp.photo
      ? '<div class="' + cls + '"><img src="' + esc(sp.photo) + '" alt="' + esc(sp.name) + '" loading="lazy"></div>'
      : '<div class="' + cls + ' arch--empty"><b>' + esc(sp.initials || initials(sp.name)) + '</b><span class="eyebrow eyebrow--muted">' + esc(caption || "фото") + "</span></div>";
  };
  (D.speakers.items || []).forEach(function (sp, i) {
    var b = doc.createElement("button"); b.type = "button"; b.className = "speaker"; b.style.setProperty("--i", i);
    b.innerHTML = '<div class="speaker__top">' + arch(sp, "arch") + '<div class="speaker__id"><h3 class="h3">' + esc(sp.name) + '</h3>' +
      (sp.role ? '<p class="speaker__role">' + esc(sp.role) + '</p>' : '') + (sp.company ? '<p class="eyebrow eyebrow--company">' + esc(sp.company) + '</p>' : '') + '</div></div>' +
      '<div class="speaker__topic"><p class="eyebrow eyebrow--red">' + (sp.time ? esc(sp.time) : 'Тема') + '</p><p' + (sp.topic ? '' : ' class="speaker__note"') + '>' + esc(sp.topic || sp.topicNote || 'Тема уточняется') + '</p></div><span class="speaker__more">Подробнее →</span><span class="speaker__glare" aria-hidden="true"></span>';
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
    $("#modalRole").hidden = !sp.role; $("#modalCompany").hidden = !sp.company;
    $("#modalTopic").textContent = sp.topic || sp.topicNote || "Тема уточняется"; $("#modalWhen").textContent = [sp.time, sp.stage].filter(Boolean).join(" · ");
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
    '<h2 class="poster__name" id="hostName">' + esc(H.name).replace(" ", "<br>") + '</h2>' + (H.role ? '<p class="poster__role">' + esc(H.role) + '</p>' : '') +
    '<div class="poster__text">' + [].concat(H.description || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' +
    '<p class="eyebrow eyebrow--gold">' + esc(H.footnote) + "</p></div>";

  /* ---- Схема проезда: блок показывается, когда в данных указан файл (venue.scheme) ---- */
  (function () {
    var V = D.venue || {}, block = $("#schemeBlock"), box = $("#lightbox");
    if (!V.scheme || !block) return;
    $("#schemeImg").src = V.scheme; $("#lightboxImg").src = V.scheme; $("#schemeCaption").textContent = V.schemeCaption || ""; block.hidden = false;
    var close = function () { box.hidden = true; doc.body.classList.remove("modal-open"); };
    $("#schemeOpen").addEventListener("click", function () { box.hidden = false; doc.body.classList.add("modal-open"); $("#lightboxClose").focus(); });
    box.addEventListener("click", close);
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  })();

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

  /* ---- Фон первого экрана. Всё движется только через transform/opacity: видеокарта двигает готовые слои,
          страница ничего не перерисовывает. Когда экран не виден, анимации стоят. ---- */
  var hero = $("#home");
  (function () {
    if (reduced) return;
    // прожектор за курсором (десктоп)
    var spot = $("#spot"), sx = 0, sy = 0, spotRaf = 0;
    if (finePointer && spot) hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect(); sx = e.clientX - r.left; sy = e.clientY - r.top;
      if (!spotRaf) spotRaf = requestAnimationFrame(function () { spotRaf = 0; spot.style.transform = "translate3d(" + sx.toFixed(0) + "px," + sy.toFixed(0) + "px,0)"; });
    }, { passive: true });
    // параллакс кулис
    var wings = $$(".wing"), raf = 0, lastY = -1;
    window.addEventListener("scroll", function () {
      if (raf || window.scrollY > 1000) return;
      raf = requestAnimationFrame(function () { raf = 0; var y = Math.min(window.scrollY, 900); if (y === lastY) return; lastY = y; wings.forEach(function (w) { w.style.transform = "translate3d(0," + (y * .18).toFixed(1) + "px,0)"; }); });
    }, { passive: true });
    // золотая пыль: несколько точек на CSS-анимации вместо canvas на весь экран
    var dust = $("#dust"), n = window.innerWidth < 640 ? 8 : 14, frag = doc.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var m = doc.createElement("span"), d = 9 + Math.random() * 12; m.className = "mote";
      m.style.cssText = "--x:" + (Math.random() * 100).toFixed(1) + "%;--y:" + (15 + Math.random() * 85).toFixed(1) + "%;--s:" + (1.5 + Math.random() * 2.5).toFixed(1) + "px;--o:" + (.25 + Math.random() * .45).toFixed(2) +
        ";--dx:" + ((Math.random() - .5) * 60).toFixed(0) + "px;--dy:" + (-60 - Math.random() * 140).toFixed(0) + "px;--d:" + d.toFixed(1) + "s;--delay:" + (-Math.random() * d).toFixed(1) + "s";
      frag.appendChild(m);
    }
    dust.appendChild(frag);
    // пауза фоновых анимаций, когда первый экран не виден или вкладка скрыта
    var seenHero = true, setAway = function () { hero.classList.toggle("is-away", !seenHero || doc.hidden); };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { seenHero = es[0].isIntersecting; setAway(); }).observe(hero);
    doc.addEventListener("visibilitychange", setAway);
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
    /* Основной путь — фрагментный шейдер: цвет каждого пикселя считается по формуле ткани, поэтому нет
       ни ступенек, ни размытия, а нагрузка ложится на видеокарту. Если WebGL недоступен — 2D-отрисовка ниже. */
    var ctx = null, gl = null, glU = null, cw = 0, ch = 0, cdpr = 1;
    var FRAG = [
      "precision highp float;",
      "uniform vec2 uRes; uniform float uT, uNow, uN, uWing, uDpr;",
      "const float DUR = 1.9; const float LAG = .34;",
      "float lead(float yn) {",                       // ведущая кромка: низ отстаёт от верха, потом затухающе качается
      "  float lag = LAG * pow(yn, 1.4);",
      "  float k = clamp((uT - lag) / DUR, 0., 1.);",
      "  float e = k < .5 ? 4. * k * k * k : 1. - pow(-2. * k + 2., 3.) / 2.;",
      "  float after = uT - lag - DUR;",
      "  float sway = after > 0. ? sin(after * 6.5) * exp(-after * 2.6) * 12. * yn : 0.;",
      "  float idle = uT <= 0. ? sin(uNow * 1.1 + yn * 9.) * 1.5 * yn : 0.;",
      "  float half_ = uRes.x * .5 + 1.;",
      "  return half_ + (uWing - half_) * e + sway + idle;",
      "}",
      "vec3 fold(float u) {",                         // объём одной складки: тень — свет — тень
      "  vec3 dark = vec3(.31, .02, .065), mid = vec3(.64, .05, .145), hi = vec3(.85, .15, .25);",
      "  float a = 1. - abs(u - .5) * 2.;",           // 0 у краёв складки, 1 в гребне
      "  vec3 c = mix(dark, mid, smoothstep(0., .55, a));",
      "  return mix(c, hi, smoothstep(.5, 1., a));",
      "}",
      "void main() {",
      "  vec2 p = gl_FragCoord.xy / uDpr; float y = uRes.y - p.y, yn = clamp(y / uRes.y, 0., 1.);",
      "  float x = p.x; if (x > uRes.x * .5) x = uRes.x - x;",
      "  float xl = lead(yn), half_ = uRes.x * .5 + 1., minW = uWing / uN;",
      "  float d = x - xl;",                          // >0 — сцена, <0 — ткань
      "  float shadow = .42 * (1. - clamp((d - 3.) / 90., 0., 1.)) * step(0., d);",
      // обратная задача: какой складке принадлежит пиксель (часть складок сжимается равномерно, часть сгребается кромкой)
      "  float jA = x * uN / (.45 * xl + .55 * half_);",
      "  float jB = (x - .55 * (xl - uN * minW)) / (.45 * xl / uN + .55 * minW);",
      "  float jf = max(jA, jB);",
      "  vec3 c = fold(fract(jf));",
      "  float v = yn < .14 ? .38 * (1. - yn / .14) : (yn > .62 ? .5 * (yn - .62) / .38 : 0.);",
      "  c *= 1. - v;",                               // тень под карнизом и к полу
      "  float hem = uRes.y - y;",                    // золотая отделка подола
      "  c = mix(c, vec3(.79, .64, .15), .9 * smoothstep(8.5, 7.5, hem) * smoothstep(3.5, 4.5, hem));",
      "  c = mix(c, vec3(.9, .78, .43), .5 * smoothstep(13.5, 13., hem) * smoothstep(11.5, 12., hem));",
      "  float tw = uRes.x < 640. ? 2. : 3.;",        // золотая кайма по кромке
      "  vec3 gold = mix(vec3(.95, .86, .58), vec3(.49, .38, .06), yn); gold = mix(gold, vec3(.79, .64, .15), 1. - abs(yn - .5) * 2.);",
      "  float trim = smoothstep(tw + .75, tw - .25, abs(d));",
      "  float cloth = smoothstep(.75, -.75, d);",    // сглаженный край ткани
      "  vec4 col = vec4(c * cloth, cloth);",
      "  col = mix(vec4(0., 0., 0., shadow), col, cloth);",
      "  col = mix(col, vec4(gold, 1.), trim);",
      "  gl_FragColor = col;",
      "}"
    ].join("\n");
    function initGL() {
      try {
        var g = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
        if (!g) return false;
        var sh = function (type, src) { var s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; };
        var prog = g.createProgram();
        g.attachShader(prog, sh(g.VERTEX_SHADER, "attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }"));
        g.attachShader(prog, sh(g.FRAGMENT_SHADER, FRAG)); g.linkProgram(prog);
        if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(prog));
        g.useProgram(prog);
        var buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
        var loc = g.getAttribLocation(prog, "a"); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
        glU = {}; ["uRes", "uT", "uNow", "uN", "uWing", "uDpr"].forEach(function (n) { glU[n] = g.getUniformLocation(prog, n); });
        gl = g; return true;
      } catch (e) { gl = null; return false; }
    }
    function sizeCurtain() {
      if (!gl && !ctx && !initGL()) ctx = cv.getContext("2d");
      cdpr = Math.min(window.devicePixelRatio || 1, gl ? 2 : 1.5); cw = window.innerWidth; ch = window.innerHeight;
      cv.width = Math.round(cw * cdpr); cv.height = Math.round(ch * cdpr);
      if (gl) gl.viewport(0, 0, cv.width, cv.height); else ctx.setTransform(cdpr, 0, 0, cdpr, 0, 0);
    }
    function drawCurtain(t) {            // t — секунды от начала открытия (≤0 — закрыт)
      if (gl) {
        gl.uniform2f(glU.uRes, cw, ch); gl.uniform1f(glU.uT, t); gl.uniform1f(glU.uNow, performance.now() / 1000);
        gl.uniform1f(glU.uN, cw < 640 ? 9 : 14); gl.uniform1f(glU.uWing, Math.max(16, Math.min(150, cw * .09))); gl.uniform1f(glU.uDpr, cdpr);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); return;
      }
      var W = cw, H = ch, N = W < 640 ? 9 : 14, M = 20, wing = Math.max(16, Math.min(150, W * .09)), half = W / 2 + 1, minW = wing / N;
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
      var r = heroEl.getBoundingClientRect(), L = $("#logoStage").getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 1.5);
      var bh = Math.min(r.height, window.innerHeight + 200); burstCv.style.height = bh + "px"; burstCv.width = r.width * d; burstCv.height = bh * d;
      var c = burstCv.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0);
      var W = L.width, H = L.height, ox = L.left - r.left, oy = L.top - r.top, S = parseFloat(getComputedStyle(logo).getPropertyValue("--S")) || 2;
      var cx = ox + W / 2, cy = oy + H / 2, sc = W / 340, K = Math.min(all.length, W < 300 ? 650 : 1000), P = [], F = [], i;
      var RK = parseFloat(getComputedStyle(logo).getPropertyValue("--rk")) || .4, RR = W * RK, PERSP = 1600;   // те же числа, что в CSS (.logo3d, .ring3d)
      var wrap = function (u, v) { var phi = (u - .5) * W / RR, k = ring ? 1 : PERSP / (PERSP + RR * (1 - Math.cos(phi))); return [cx + RR * Math.sin(phi) * k, cy + (v - .5) * H * k]; };
      for (i = 0; i < K; i++) {
        var q = all[(Math.random() * all.length) | 0], u = q[0] + (Math.random() - .5) / 150, v = q[1] + (Math.random() - .5) / 150;
        var sx = cx + S * (u - BX) * W, sy = cy + S * (v - BY) * H, a = Math.atan2(sy - cy, sx - cx) + (Math.random() - .5) * 1.1, sp = (5 + Math.random() * 17) * sc;
        var tg = wrap(u, v);
        P.push({ x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2 * sc, tx: tg[0], ty: tg[1], free: .3 + Math.random() * .22, s: (1.3 + Math.random() * 1.9) * Math.max(sc, .8), tw: Math.random() * 6.28 });
      }
      for (i = 0; i < 110; i++) {          // пена и искры, которые улетают
        var a2 = Math.random() * 6.28, sp2 = (3 + Math.random() * 15) * sc, bubble = i < 70;
        F.push({ x: cx + (Math.random() - .5) * 30 * sc, y: cy + (Math.random() - .5) * 90 * sc, vx: Math.cos(a2) * sp2, vy: Math.sin(a2) * sp2 - (bubble ? 3 : 1) * sc, r: bubble ? (2 + Math.random() * 6) * sc : 0, life: .7 + Math.random() * .9, bubble: bubble });
      }
      // крышка: слетает с горлышка, кувыркается и падает
      var cap = { x: cx, y: cy + S * (BY - .2751 - BY) * H, vx: -4.5 * sc, vy: -17 * sc, a: 0, va: -.32, w: 26 * sc * S / 1.9, h: 10 * sc * S / 1.9 };
      var t0 = performance.now(), prev = t0;
      (function frame(now) {
        now = now || performance.now(); var T = (now - t0) / 1000 / SLOW, dt = Math.min((now - prev) / 16.67, 3) / SLOW; prev = now;
        c.clearRect(0, 0, r.width, r.height);
        if (T > 2) { burstCv.width = burstCv.width; return; }
        var mix = Math.max(0, Math.min(1, (T - .3) / .85)), fade = T < 1.4 ? 1 : Math.max(0, 1 - (T - 1.4) / .45);
        var R = Math.round(230 + 25 * mix), G = Math.round(199 + 56 * mix), B = Math.round(110 + 145 * mix), drag = Math.pow(.925, dt);
        c.globalCompositeOperation = "lighter";
        for (i = 0; i < F.length; i++) {
          var f = F[i]; if (T > f.life) continue; var al = (1 - T / f.life) * .8;
          f.vx *= drag; f.vy = f.vy * drag + (f.bubble ? -.05 : .16) * dt; f.x += f.vx * dt; f.y += f.vy * dt;
          if (f.bubble) { c.beginPath(); c.arc(f.x, f.y, f.r, 0, 6.28); c.strokeStyle = "rgba(255,240,205," + al.toFixed(3) + ")"; c.lineWidth = 1.2; c.stroke(); }
          else { c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x - f.vx * 2.4, f.y - f.vy * 2.4); c.strokeStyle = "rgba(230,199,110," + al.toFixed(3) + ")"; c.lineWidth = 1.6; c.stroke(); }
        }
        c.globalCompositeOperation = "source-over";
        if (T < 1.5) {
          cap.vy += .5 * dt; cap.vx *= Math.pow(.99, dt); cap.x += cap.vx * dt; cap.y += cap.vy * dt; cap.a += cap.va * dt;
          c.save(); c.translate(cap.x, cap.y); c.rotate(cap.a); c.globalAlpha = T < 1.1 ? 1 : Math.max(0, 1 - (T - 1.1) / .4);
          c.fillStyle = "#E6C76E"; c.fillRect(-cap.w / 2, -cap.h / 2, cap.w, cap.h * .62);
          c.fillStyle = "#C9A227"; for (var q2 = 0; q2 < 7; q2++) c.fillRect(-cap.w / 2 + q2 * cap.w / 7, cap.h * .12, cap.w / 7 - 1, cap.h * .38);
          c.restore(); c.globalAlpha = 1;
        }
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
      logo.className = "logo3d"; void logo.offsetWidth; if (ring) ring.hide();
      logo.style.setProperty("--charge", (chargeMs / 1000) + "s"); logo.classList.add("is-charging");
      later(function () {
        logo.classList.remove("is-charging"); logo.classList.add("is-burst");
        heroEl.classList.add("is-shake"); later(function () { heroEl.classList.remove("is-shake"); }, 450);
        var ok = burst(heroEl), landAt = ok ? 1280 : 300;
        later(function () { logo.classList.add("is-ring-in"); if (ring) ring.spinIn(); }, ok ? 220 : 60);       // надпись влетает на цилиндр: оборот 360°
        later(function () { logo.classList.add("is-bottle"); if (ring) ring.setFull(); }, landAt);               // частицы сели: бутылка белая, на месте
        later(function () { if (onDone) onDone(); }, landAt + 200);
        later(function () { logo.className = "logo3d is-final"; logoBusy = false; if (ring) ring.rest(); }, landAt + 700);
      }, chargeMs + 150);
    }
    logo.addEventListener("click", function () { if (!introDone || reduced) return; playLogo(700); });
    /* Цилиндр с логотипами. Основной путь — один WebGL-холст: фрагментный шейдер для каждого пикселя находит точку
       на поверхности цилиндра и берёт цвет из текстуры логотипа (половина окружности — форум, вторая — CCI).
       Это один слой вместо 36, поэтому вращение почти ничего не стоит. Без WebGL — запасной вариант на CSS-полосах. */
    var ring = (function () {
      var holder = $(".ring3d"), spinEl = $("#ringSpin");
      var base = bottleImg.src.replace(/[^/]+$/, "");
      function buildStrips() {             // запасной путь: 36 прозрачных полос, вращение — CSS-анимация ring-spin
        var N = 18, html = "", k;
        for (var f = 0; f < 2; f++) for (k = 0; k < N; k++) html += '<i class="f' + f + '" style="--i:' + k + ';--a:' + ((k + .5) * 180 / N - 90 + f * 180).toFixed(2) + '"></i>';
        spinEl.innerHTML = html;
        ["logo-text.png", "horeca-forum-2026-white.png", "cci-white.png"].forEach(function (n) { var im = new Image(); im.src = base + n; });
        return null;
      }
      var cvs = doc.createElement("canvas"), g = null, U = {}, prog;
      try { g = cvs.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" }); } catch (e) {}
      if (!g) return buildStrips();
      var FS = [
        "precision highp float;",
        "uniform vec2 uSize, uA, uB; uniform float uDpr, uR, uRot, uFull;",
        "uniform sampler2D uText, uLogo, uCci;",
        "const float PI = 3.14159265;",
        // 1 внутри картинки, 0 снаружи и на кромке в пару пикселей: на самой границе сглаживание текстуры даёт светлую линию
        "float inside(vec2 uv) { return step(.008, uv.x) * step(uv.x, .992) * step(.008, uv.y) * step(uv.y, .992); }",
        "void main() {",
        "  vec2 p = gl_FragCoord.xy / uDpr - uSize * .5; float x = p.x, y = -p.y;",
        "  if (abs(x) >= uR) { gl_FragColor = vec4(0.); return; }",
        "  float th = mod(asin(x / uR) - uRot + PI, 2. * PI) - PI;",        // угол точки на поверхности цилиндра
        "  vec4 c = vec4(0.);",
        "  if (abs(th) <= PI * .5) {",                                      // половина с логотипом форума
        "    vec2 uv = vec2(th * uR / uA.x + .5, y / uA.y + .5);",
        "    c = mix(texture2D(uText, uv), texture2D(uLogo, uv), uFull) * inside(uv);",
        "  } else {",                                                       // половина с логотипом CCI
        "    float t2 = th > 0. ? th - PI : th + PI; vec2 uv = vec2(t2 * uR / uB.x + .5, y / uB.y + .5);",
        "    c = texture2D(uCci, uv) * inside(uv);",
        "  }",
        "  gl_FragColor = c * smoothstep(uR, uR - 2., abs(x));",
        "}"
      ].join("\n");
      try {
        var sh = function (type, src) { var s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; };
        prog = g.createProgram(); g.attachShader(prog, sh(g.VERTEX_SHADER, "attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }")); g.attachShader(prog, sh(g.FRAGMENT_SHADER, FS)); g.linkProgram(prog);
        if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(prog));
        g.useProgram(prog);
        var buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
        var loc = g.getAttribLocation(prog, "a"); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
        ["uSize", "uA", "uB", "uDpr", "uR", "uRot", "uFull", "uText", "uLogo", "uCci"].forEach(function (n) { U[n] = g.getUniformLocation(prog, n); });
      } catch (e) { return buildStrips(); }
      holder.innerHTML = ""; holder.appendChild(cvs); holder.classList.add("is-gl");

      // текстуры: картинка растягивается до 1024×1024, чтобы работало сглаживание при уменьшении (mipmap)
      var loaded = 0;
      [["uText", "logo-text.png"], ["uLogo", "horeca-forum-2026-white.png"], ["uCci", "cci-white.png"]].forEach(function (d, unit) {
        var tex = g.createTexture(), im = new Image();
        g.activeTexture(g.TEXTURE0 + unit); g.bindTexture(g.TEXTURE_2D, tex);
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array(4)); g.uniform1i(U[d[0]], unit);
        im.onload = function () {
          var oc = doc.createElement("canvas"); oc.width = oc.height = 1024; oc.getContext("2d").drawImage(im, 0, 0, 1024, 1024);
          g.activeTexture(g.TEXTURE0 + unit); g.bindTexture(g.TEXTURE_2D, tex); g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
          g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, oc); g.generateMipmap(g.TEXTURE_2D);
          g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
          g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
          loaded++; draw();
        };
        im.src = base + d[1];
      });

      var mode = "hidden", t = 0, full = 0, running = false, last = 0, raf = 0, onScreen = true, W = 0, H = 0, dpr = 1;
      var RK = parseFloat(getComputedStyle(logo).getPropertyValue("--rk")) || .4;
      function size() {
        var r = holder.getBoundingClientRect(); if (!r.width) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height;
        var cwid = Math.round(W * dpr), chei = Math.round(H * dpr);
        if (cvs.width !== cwid || cvs.height !== chei) { cvs.width = cwid; cvs.height = chei; g.viewport(0, 0, cwid, chei); }
      }
      function angle() {                   // градусы поворота; отрицательные — по часовой стрелке (вид сверху)
        if (mode === "in") { var k = Math.min(1, t / 1.1); return 360 * Math.pow(1 - k, 3); }           // влёт: один оборот с торможением
        if (mode === "rest") { var tau = t - 1.2, w = 24; if (tau <= 0) return 0; return tau < 2.5 ? -.5 * w * tau * tau / 2.5 : -30 - w * (tau - 2.5); }   // пауза, разгон, ровное вращение
        return 0;
      }
      function draw() {
        if (loaded < 3 || !W) return;
        g.uniform2f(U.uSize, W, H); g.uniform1f(U.uDpr, dpr); g.uniform1f(U.uR, W * RK);
        g.uniform2f(U.uA, W, H); g.uniform2f(U.uB, W * .94, W * .94 / 1.779);
        g.uniform1f(U.uRot, angle() * Math.PI / 180); g.uniform1f(U.uFull, full);
        g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT); g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
      }
      var tick = 0;
      function frame(now) {
        raf = 0; if (!running) return;
        t += Math.min((now - last) / 1000, .1) / SLOW; last = now; draw();
        // влёт и разгон идут на полной частоте; ровное медленное вращение рисуется через кадр (около 30 раз в секунду) —
        // на глаз то же самое, а страница вдвое реже пересобирает кадр
        if (mode === "rest" && t > 3.7) { tick = setTimeout(function () { tick = 0; if (running) raf = requestAnimationFrame(frame); }, 18); }
        else raf = requestAnimationFrame(frame);
      }
      function start() { if (running || mode === "hidden" || !onScreen || doc.hidden || reduced) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } if (tick) { clearTimeout(tick); tick = 0; } }
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(holder);
      doc.addEventListener("visibilitychange", function () { if (doc.hidden) stop(); else start(); });
      window.addEventListener("resize", function () { size(); draw(); });
      return {
        ortho: true,
        spinIn: function () { mode = "in"; t = 0; full = 0; size(); draw(); start(); },
        setFull: function () { full = 1; if (!running) draw(); },
        rest: function () { mode = "rest"; t = 0; full = 1; size(); draw(); start(); },
        hide: function () { mode = "hidden"; stop(); }
      };
    })();

    /* ---------- Запуск ---------- */
    function finish() {                  // мгновенно в конечное состояние (пропуск, страховка)
      if (introDone) return; introDone = true;
      timers.forEach(clearTimeout); timers = []; logoBusy = false;
      hideCurtain(false); root.classList.add("stage-lit");
      logo.className = "logo3d is-final"; burstCv.width = burstCv.width; if (ring) ring.rest();
      showRest(0); unbind();
    }
    var skipEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
    function unbind() { skipEvents.forEach(function (ev) { window.removeEventListener(ev, finish); }); }

    var seen = false, force = /\bintro=1\b/.test(location.search);
    try { seen = sessionStorage.getItem("curtainSeen") === "1"; } catch (e) {}
    if (reduced) { finish(); return; }
    if (seen && !force) {                // повторный заход: без занавеса, надпись делает оборот
      introDone = true; hideCurtain(false); root.classList.add("stage-lit"); showRest(0);
      logo.className = "logo3d is-final"; if (ring) ring.rest(); return;
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
