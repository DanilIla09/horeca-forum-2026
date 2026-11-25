/* HoReCa Forum 2026 – логика и анимации. Данные: data/event.js (window.EVENT_DATA). */
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
  // Номер версии из адреса этого скрипта (…/app.js?v=…). Дописывается к адресам фото: после замены картинок браузер не покажет старые из кэша.
  var VER = ((doc.currentScript && doc.currentScript.src) || "").split("?v=")[1] || "";
  var withVer = function (url) { return url && VER && url.indexOf("?") < 0 ? url + "?v=" + VER : url; };

  /* ---- Простые поля ---- */
  $$("[data-field]").forEach(function (el) { var v = get(el.getAttribute("data-field")); if (v != null) el.textContent = v; });
  $("#navMeta").textContent = [D.dateText, D.timeText, D.venueShort].filter(Boolean).join(" · ");
  $("#aboutEyebrow").textContent = D.about.eyebrow || ""; $("#aboutEyebrow").hidden = !D.about.eyebrow; $("#programEyebrow").textContent = D.program.eyebrow;
  var seasonEl = $('[data-field="season"]'); if (seasonEl) seasonEl.hidden = !D.season;
  $("#speakersEyebrow").textContent = D.speakers.eyebrow || ""; $("#speakersEyebrow").hidden = !D.speakers.eyebrow; $("#speakersSub").textContent = D.speakers.sub;
  $("#menuEyebrow").textContent = D.menu.eyebrow; $("#menuTeaser").textContent = D.menu.teaser || "";
  $("#venueEyebrow").textContent = D.venue.eyebrow || ""; $("#venueEyebrow").hidden = !D.venue.eyebrow; $("#orgLabel").textContent = D.footer.organizerLabel; $("#copyright").textContent = D.footer.copyright;

  /* ---- Заголовок hero: слова появляются по очереди, {слово} – золотым. Строки нет – h1 с названием форума скрыт от глаз, но остаётся для читалок экрана ---- */
  (function () {
    var h = $("#heroTitle"), idx = 0;
    if (!(D.heroTitle || []).length) { h.textContent = D.title || ""; h.className = "sr-only"; return; }
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
  $("#aboutLead").innerHTML = esc(D.about.lead).replace(/\{([^}]+)\}/g, "<strong>$1</strong>");
  $("#aboutText").hidden = !(D.about.paragraphs || []).length;
  var at = $("#aboutText"); (D.about.paragraphs || []).forEach(function (p) { var el = doc.createElement("p"); el.textContent = p; at.appendChild(el); });
  var pl = $("#pillars"); pl.hidden = !(D.about.pillars || []).length; (D.about.pillars || []).forEach(function (p, i) {
    var li = doc.createElement("li"); li.style.setProperty("--i", i);
    li.innerHTML = '<span class="pillars__num">' + esc(p.num) + '</span><h3 class="h3">' + esc(p.title) + '</h3><p>' + esc(p.text) + "</p>"; pl.appendChild(li);
  });

  /* ---- Программа ---- */
  var tl = $("#timeline");
  (D.program.items || []).forEach(function (p, i) {
    var li = doc.createElement("li"); li.className = "tl" + (p.isBreak ? " tl--break" : "") + (p.time ? "" : " tl--cont"); li.style.setProperty("--i", i);
    li.innerHTML = (p.time ? '<time class="tl__time"><b>' + esc(p.time) + '</b>' + (p.end ? '<span>–' + esc(p.end) + '</span>' : '') + '</time><span class="tl__dot" aria-hidden="true"></span>' : '<span></span><span></span>') +
      '<div class="tl__body">' + (p.label ? '<p class="eyebrow ' + (p.isBreak ? "eyebrow--badge" : "eyebrow--text") + '">' + esc(p.label) + '</p>' : "") +
      '<h3 class="h3">' + esc(p.title) + '</h3>' + (p.role ? '<p class="tl__role">' + esc(p.role) + '</p>' : "") + (p.meta ? '<p class="tl__meta">' + esc(p.meta) + '</p>' : "") + "</div>";
    tl.appendChild(li);
  });

  /* ---- Спикеры + модалка ---- */
  var grid = $("#speakersGrid"), modal = $("#modal");
  // фото стоит в рамке сразу, без анимации: шторы – часть самого снимка (фон)
  var arch = function (sp, cls, caption) {
    return sp.photo
      ? '<div class="' + cls + '"><img src="' + esc(withVer(sp.photo)) + '" alt="' + esc(sp.name) + '" loading="lazy"></div>'
      : '<div class="' + cls + ' arch--empty"><b>' + esc(sp.initials || initials(sp.name)) + '</b><span class="eyebrow">' + esc(caption || "фото") + "</span></div>";
  };
  // компания спикера: логотип, если он задан в данных, иначе название текстом
  var companyMark = function (sp, cls) {
    if (!sp.company) return "";
    return sp.logo ? '<img class="' + cls + '" src="' + esc(withVer(sp.logo)) + '" alt="' + esc(sp.company) + '" loading="lazy">' : esc(sp.company);
  };
  (D.speakers.items || []).forEach(function (sp, i) {
    var b = doc.createElement("button"); b.type = "button"; b.className = "speaker"; b.style.setProperty("--i", i);
    b.innerHTML = '<div class="speaker__top">' + arch(sp, "arch") + '<div class="speaker__id"><h3 class="h3">' + esc(sp.name) + '</h3>' +
      (sp.role ? '<p class="speaker__role">' + esc(sp.role) + '</p>' : '') + (sp.company ? '<p class="eyebrow eyebrow--company">' + companyMark(sp, "speaker__logo") + '</p>' : '') + '</div></div>' +
      '<div class="speaker__topic"><p' + (sp.topic ? '' : ' class="speaker__note"') + '>' + esc(sp.topic || sp.topicNote || 'Тема уточняется') + '</p></div><span class="speaker__more">Подробнее →</span>';
    b.addEventListener("click", function () { openModal(sp); });
    grid.appendChild(b);
  });
  var lastFocus = null;
  function openModal(sp) {
    lastFocus = doc.activeElement;
    $("#modalPhoto").innerHTML = arch(sp, "arch arch--lg");
    $("#modalName").textContent = sp.name || ""; $("#modalRole").textContent = sp.role || ""; $("#modalCompany").innerHTML = companyMark(sp, "speaker__logo speaker__logo--lg");
    $("#modalRole").hidden = !sp.role; $("#modalCompany").hidden = !sp.company;
    $("#modalTopic").textContent = sp.topic || sp.topicNote || "Тема уточняется"; $("#modalWhen").textContent = sp.stage || ""; $("#modalWhen").hidden = !sp.stage;       // время выступления не показываем (просьба заказчика), только зал, если задан
    $("#modalBio").textContent = sp.bio || "";
    modal.hidden = false; doc.body.classList.add("modal-open");
    void modal.offsetWidth;        // браузер должен увидеть закрытое состояние, иначе окно появится без движения
    requestAnimationFrame(function () { requestAnimationFrame(function () { modal.classList.add("is-open"); $(".modal__close", modal).focus(); }); });
  }
  function closeModal() {
    modal.classList.remove("is-open"); doc.body.classList.remove("modal-open");
    setTimeout(function () { modal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }, reduced ? 0 : 220);
  }
  $$("[data-close]", modal).forEach(function (el) { el.addEventListener("click", closeModal); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") { if (!modal.hidden) closeModal(); closeNav(); } });

  /* ---- Ведущие: по блоку на каждого из D.hosts. Первый блок есть в разметке (#host), остальные создаются следом за ним ---- */
  (function () {
    var hosts = D.hosts || (D.host ? [D.host] : []), first = $("#host"), prev = first;
    if (!hosts.length) { first.hidden = true; return; }
    hosts.forEach(function (H, n) {
      var sec = first;
      if (n) { sec = doc.createElement("section"); sec.className = "section"; sec.id = "host" + (n + 1); sec.innerHTML = '<div class="container"><article class="poster reveal"></article></div>'; prev.after(sec); }
      $(".poster", sec).classList.toggle("poster--wide", !!H.photoWide);
      $(".poster", sec).innerHTML = '<div class="poster__frame" aria-hidden="true"></div>' + arch(H, "arch arch--poster" + (H.photoWide ? " arch--wide" : ""), "фото") +
        '<div class="poster__body">' + (H.eyebrow ? '<p class="eyebrow eyebrow--gold">' + esc(H.eyebrow) + '</p>' : "") + '<p class="poster__kicker">' + esc(H.kicker) + '</p>' +
        '<h2 class="poster__name">' + esc(H.name).replace(" ", "<br>") + '</h2>' + (H.role ? '<p class="poster__role">' + esc(H.role) + '</p>' : '') +
        ([].concat(H.description || []).length ? '<div class="poster__text">' + [].concat(H.description || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' : "") +
        (H.footnote ? '<p class="eyebrow eyebrow--gold">' + esc(H.footnote) + "</p>" : "") + "</div>";
      prev = sec;
    });
  })();

  /* ---- Чередование фонов: первый экран светлый, дальше блоки идут красный – светлый – красный…
          Скрытые блоки пропускаются, поэтому порядок не ломается, если убрать или добавить блок. ---- */
  (function () {
    var red = true;
    $$("#main > section.section").forEach(function (s) {
      if (s.hidden) return;
      s.classList.toggle("section--red", red); s.classList.toggle("section--ivory", !red); red = !red;
    });
    var f = $(".footer"); if (f) f.classList.toggle("footer--edge", !red);     // последний блок красный – подвал отделяется линией
  })();

  /* ---- Локация: кнопки маршрута и изображение «Как добраться» (появляется, когда в данных задан venue.scheme) ---- */
  (function () {
    var V = D.venue || {}, how = $("#venueHow"), box = $("#lightbox"), wrap = $("#venue .venue");
    $("#route2gis").href = V.route2gis || "#"; $("#routeGoogle").href = V.routeGoogle || "#";
    if (!V.scheme) { if (wrap) wrap.classList.add("venue--solo"); return; }
    $("#schemeImg").src = V.scheme; $("#lightboxImg").src = V.scheme; $("#schemeCaption").textContent = V.schemeCaption || ""; $("#schemeCaption").hidden = !V.schemeCaption; how.hidden = false;
    var close = function () { box.hidden = true; doc.body.classList.remove("modal-open"); };
    $("#schemeOpen").addEventListener("click", function () { box.hidden = false; doc.body.classList.add("modal-open"); $("#lightboxClose").focus(); });
    box.addEventListener("click", close);
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
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
     ВСТУПЛЕНИЕ: занавес закрыт → средние полотна расходятся от середины
     (верх уходит первым, щель буквой V), по бокам остаются шторы с кистями.
     Первый экран под занавесом уже собран. Один раз за сессию.
     ====================================================================== */
  (function () {
    var curtain = $("#curtain"), cv = $("#curtainCanvas"), logo = $("#logo3d");
    var heroReveals = $$(".hero .reveal");
    var T_OPEN = 500;                 // мс: столько занавес стоит закрытым, затем полотна расходятся
    var introDone = false, timers = [];
    // отладка: ?slow=8 замедляет всё вступление в 8 раз (и CSS-анимации логотипа)
    var SLOW = Math.max(1, parseFloat((location.search.match(/[?&]slow=([\d.]+)/) || [])[1]) || 1);
    if (SLOW > 1) (function rate() { if (doc.getAnimations) doc.getAnimations().forEach(function (a) { var t = a.effect && a.effect.target; if (t && t.closest && t.closest(".logo3d, .curtain, .hero__inner")) a.playbackRate = 1 / SLOW; }); requestAnimationFrame(rate); })();
    var later = function (fn, ms) { var id = setTimeout(fn, ms * SLOW); timers.push(id); return id; };

    function showRest() {             // блоки первого экрана появляются по очереди
      heroReveals.forEach(function (el, i) { el.style.transitionDelay = (i * 110) + "ms"; el.classList.add("in"); });
      root.classList.add("logo-done");
    }
    function hideCurtain(fade) {
      root.classList.remove("curtain-closed");
      if (!fade) { curtain.classList.add("is-hidden"); return; }
      curtain.classList.add("is-fading"); setTimeout(function () { curtain.classList.add("is-hidden"); }, 650);
    }

    /* ---------- Занавес: бархатные шторы на canvas ---------- */
    /* Шторы как на приглашении форума: бархат в неровных складках, сверху драпировка, по бокам подхват золотым шнуром с кистью.
       Всё считает фрагментный шейдер: цвет каждого пикселя по формуле ткани, поэтому нет ни ступенек, ни размытия.
       Боковые шторы всегда стоят раскрытыми. Во вступлении за ними висят средние полотна (uP – секунды от начала открытия):
       они расходятся от середины, верх уходит первым, низ догоняет. Тот же шейдер рисует неподвижные шторы первого экрана (drawDrapes ниже).
       Если WebGL недоступен – упрощённая 2D-отрисовка ниже и плоские кулисы .wing из CSS. */
    var ctx = null, gl = null, cw = 0, ch = 0, cdpr = 1;
    var FRAG = [
      "precision highp float;",
      "uniform vec2 uRes; uniform float uP, uN, uDpr, uDc, uSw, uTieW, uBotW, uTieY;",
      "const float PDUR = 1.2; const float PLAG = .45;",   // среднее полотно: длительность хода и отставание низа от верха, с
      "float YT;",                                    // высота подхвата (доля высоты экрана); её и ширину штор у подхвата и внизу задаёт drapeFit по месту содержимого
      "float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }",
      "float finalEdge(float yn, float r) {",         // внутренний край боковой шторы: сверху широко, у подхвата узко, ниже чуть расходится
      "  float wide = smoothstep(600., 1000., uRes.x);",                                   // на узком экране шторы тоньше, чтобы не закрывать логотип
      "  float top = min(uRes.x * mix(.17, .21, wide), 340.), tie = uTieW, bot = uBotW;",
      "  float dy = sqrt((yn - YT) * (yn - YT) + r * r) - r;",   // r скругляет перегиб у подхвата: в движении плавная дуга, в конце узкая перетяжка
      "  if (yn < YT) return tie + (top - tie) * (1. - pow(max(1. - dy / YT, 0.), 2.6));",
      "  return tie + (bot - tie) * (1. - exp(-dy / .07));",
      "}",
      "float panelEdge(float yn) {",                  // кромка среднего полотна: от середины к краю, верх уходит первым – щель буквой V
      "  float k = clamp((uP - PLAG * yn) / PDUR, 0., 1.);",
      "  float e = k < .5 ? 4. * k * k * k : 1. - .5 * (2. - 2. * k) * (2. - 2. * k) * (2. - 2. * k);",
      "  return (uRes.x * .5 + 1.) * (1. - e) - 8. * e;",
      "}",
      "float relief(float j) {",                      // рельеф ткани поперёк складок: гребни разной высоты и мелкая рябь
      "  float w = .5 - .5 * cos(6.2832 * fract(j));",
      "  return (1. - pow(max(1. - w, 0.), 1.6)) * (.78 + .22 * hash(floor(j))) + .07 * sin(12.566 * j + 1.3) + .03 * sin(18.85 * j + 4.1);",
      "}",
      "vec3 velvet(float t) {",                       // бархат: тень в складке → красный → блик на гребне
      "  vec3 dark = vec3(.19, .0, .0), mid = vec3(.686, .0, .0), hi = vec3(.90, .15, .12);",
      "  vec3 c = mix(dark, mid, clamp(t / .55, 0., 1.));",
      "  return mix(c, hi, clamp((t - .55) / .45, 0., 1.));",
      "}",
      "float shade(float j) {",                       // освещённость точки на складке: свет сбоку-спереди, во впадинах темнее
      "  float s = (relief(j + .012) - relief(j - .012)) / .024;",
      "  float nx = -s * .42, inv = inversesqrt(nx * nx + 1.);",
      "  float diff = clamp((nx * -.5 + .866) * inv, 0., 1.);",
      "  float occ = clamp((relief(j) + .10) / 1.2, 0., 1.);",
      "  return (.24 + .76 * pow(diff, 1.3)) * (.50 + .50 * occ) + .06 * clamp((diff - .9) / .1, 0., 1.) * occ * occ * occ;",
      "}",
      "void main() {",
      "  vec2 p = gl_FragCoord.xy / uDpr; float W = uRes.x, H = uRes.y; float y = H - p.y, yn = clamp(y / H, 0., 1.);",
      "  float wideM = smoothstep(600., 1000., W); YT = clamp(uTieY / H, .25, .8);",
      "  float x = min(p.x, W - p.x);",               // правая штора – зеркало левой
      "  float xl = finalEdge(yn, .012), d = x - xl;", // d > 0 – сцена, d < 0 – ткань
      "  float sh = clamp(1. - (d - 2.) / mix(16., 110., smoothstep(400., 1400., W)), 0., 1.); float shadow = .34 * sh * sh * step(0., d);",
      // боковая штора: складки сходятся к подхвату
      "  float u = clamp(x / max(xl, 1.), 0., 1.);",
      "  float j = uN * (u + .035 * sin(u * 9. + .7) + .02 * sin(u * 23. + 2.));",
      "  float t = mix(.30, shade(j), smoothstep(1.5, 7., max(xl, 1.) / uN));",
      "  t *= .74 + .26 * smoothstep(0., 12., -d);",  // у кромки ткань заворачивается и темнеет
      "  t *= 1. - (yn < .16 ? .30 * (1. - yn / .16) : 0.) - (yn > .7 ? .35 * (yn - .7) / .3 : 0.);",
      "  float gather = clamp(1. - xl / (W * .25), 0., 1.);",
      "  float gy = (yn - YT) / .05; t *= 1. - .30 * gather * exp(-gy * gy);",
      "  vec3 c = velvet(t);",
      // среднее полотно: висит за боковыми шторами, складки сжимаются по мере ухода к краю
      "  float xp = panelEdge(yn), dp = x - xp, np = uN * 1.5;",
      "  float up = clamp(x / max(xp, 1.), 0., 1.);",
      "  float jp = np * (up + .03 * sin(up * 11. + 2.1) + .015 * sin(up * 27. + .4)) + .37;",
      "  float tp = mix(.30, shade(jp), smoothstep(1.5, 7., max(xp, 1.) / np)) * .86;",
      "  tp *= .74 + .26 * smoothstep(0., 12., -dp);",
      "  tp *= 1. - (yn < .16 ? .30 * (1. - yn / .16) : 0.) - (yn > .7 ? .35 * (yn - .7) / .3 : 0.);",
      "  vec3 cp = velvet(tp) * (1. - 1.5 * shadow);",          // на полотно падает тень боковой шторы
      "  float shq = clamp(1. - (dp - 2.) / mix(16., 110., smoothstep(400., 1400., W)), 0., 1.);",
      "  float shadowP = .34 * shq * shq * step(0., dp) * clamp(xp / 40., 0., 1.);",   // тень полотна на сцене; гаснет, когда полотно ушло
      "  float panel = smoothstep(.75, -.75, dp);",
      // шнур подхвата и кисть
      "  const float a = 1.;",
      "  float k = clamp(W / 1250., .72, 1.4);",
      "  float xe = finalEdge(YT, .012), yt = YT * H;",
      "  float yr = yt - (xe - x) * .24, dr = abs(y - yr);",
      "  float rope = a * smoothstep(4.5 * k, 3.5 * k, dr) * step(x, xe + 3. * k);",
      "  vec3 g1 = vec3(.50, .35, .10), g2 = vec3(.82, .64, .27), g3 = vec3(.97, .86, .55);",
      "  float tw = .5 + .5 * sin((x * 1.1 + (y - yr) * 1.6) / k);",
      "  vec3 ropeC = mix(g1, g2, tw); ropeC = mix(ropeC, g3, smoothstep(.75, 1., tw) * (1. - dr / (4.5 * k)));",
      "  c *= 1. - .40 * a * exp(-dr * dr / (90. * k * k)) * step(x, xe + 3. * k);",
      "  float x0 = xe - mix(6., 1., wideM), ty = y - yt;",
      "  float cord = smoothstep(2.2 * k, 1.2 * k, abs(x - x0)) * step(0., ty) * step(ty, 24. * k);",
      "  float head = smoothstep(8.5 * k, 7.5 * k, length(vec2(x - x0, ty - 30. * k)));",
      "  float v = (ty - 38. * k) / (62. * k);",
      "  float hw = (6.5 + 6.5 * clamp(v, 0., 1.)) * k;",
      "  float skirt = smoothstep(hw + .75, hw - .75, abs(x - x0)) * step(0., v) * smoothstep(1., .97, v + .02 * sin(x * 2.6));",
      "  float tas = a * max(cord, max(head, skirt));",
      "  float cyl = 1. - .55 * pow(clamp(abs(x - x0) / max(hw, 1.), 0., 1.), 2.);",
      "  float thr = .65 + .35 * sin((x - x0) * 2.6 / k + sin(ty * .05) * 1.5);",
      "  vec3 tasC = mix(g1, g2, cyl * (skirt > head ? thr : 1.));",
      "  tasC = mix(tasC, g3, .35 * cyl * smoothstep(-2., -6., (x - x0) / k));",
      "  tasC *= 1. - .45 * smoothstep(34. * k, 38. * k, ty) * smoothstep(44. * k, 40. * k, ty);",
      // драпировка сверху: полукружия ткани между точками сборки, складки повторяют провис
      "  float P = W / uSw, q = fract(p.x / P), tl = min(q, 1. - q) * 2.;",   // tl: 0 – середина полукружия, 1 – точка сборки
      "  float Dc = uDc;",                              // глубина драпировки в середине полукружия (задаёт drapeFit: не ниже верха логотипа)
      "  float ys = y, D = Dc * (.16 + .84 * pow(max(1. - tl * tl, 0.), .8)), s = ys / D;",
      "  float js = 4.6 * pow(clamp(s, 0., 1.), 1.25);",
      "  float ts = mix(.30, shade(js), smoothstep(1.5, 6., D / 4.6));",
      "  ts *= (.80 + .20 * (1. - tl)) * (.72 + .28 * smoothstep(0., .3, s)) * (1. - .35 * smoothstep(.7, 1., tl));",
      "  ts = mix(ts, ts * 1.25 + .05, smoothstep(.90, .97, s));",
      "  float swag = smoothstep(.75, -.75, ys - D);",
      "  float sws = .5 * pow(clamp(1. - (ys - D) / 34., 0., 1.), 2.) * step(D, ys);",
      // сборка слоёв (цвет с предумноженной прозрачностью): тень на сцене → среднее полотно → штора → шнур → кисть → тень драпировки → драпировка
      "  float cloth = smoothstep(.75, -.75, d);",
      "  vec4 col = mix(vec4(0., 0., 0., max(shadow, shadowP)), vec4(cp, 1.), panel);",
      "  col = mix(col, vec4(c, 1.), cloth);",
      "  col = mix(col, vec4(ropeC, 1.), rope);",
      "  col = mix(col, vec4(tasC, 1.), tas);",
      "  col = vec4(col.rgb * (1. - sws), col.a + (1. - col.a) * sws);",
      "  col = mix(col, vec4(velvet(ts), 1.), swag);",
      "  gl_FragColor = col;",
      "}"
    ].join("\n");
    function makeGL(canvas) {            // WebGL-контекст с программой штор на данном холсте; null, если WebGL недоступен
      try {
        var g = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
        if (!g) return null;
        var sh = function (type, src) { var s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; };
        var prog = g.createProgram();
        g.attachShader(prog, sh(g.VERTEX_SHADER, "attribute vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }"));
        g.attachShader(prog, sh(g.FRAGMENT_SHADER, FRAG)); g.linkProgram(prog);
        if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(prog));
        g.useProgram(prog);
        var buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
        var loc = g.getAttribLocation(prog, "a"); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
        var U = {}; ["uRes", "uP", "uN", "uDpr", "uDc", "uSw", "uTieW", "uBotW", "uTieY"].forEach(function (n) { U[n] = g.getUniformLocation(prog, n); });
        return { g: g, U: U, cv: canvas };
      } catch (e) { return null; }
    }
    /* Размеры штор под содержимое первого экрана: шторы не должны заходить на карточки, отсчёт и кнопку.
       Ширина у подхвата и внизу – не больше свободного поля слева от содержимого. На узком экране подхват стоит над карточками:
       выше него штора широкая (рядом с логотипом есть место), ниже висит узкой полосой в поле страницы.
       Положение берётся из вёрстки (offsetLeft/offsetTop), а не из getBoundingClientRect: блоки в момент вступления сдвинуты анимацией. */
    function drapeFit(w, h) {
      var wide = Math.min(1, Math.max(0, (w - 600) / 400)); wide = wide * wide * (3 - 2 * wide);
      var tie = Math.min(w * (.042 + .02 * wide), 96), bot = Math.min(w * (.05 + .038 * wide), 136), tieY = h * .6;
      var inner = $(".hero__inner"), facts = $(".facts"), side = Infinity, navH = nav.offsetHeight || 64;
      var dc = navH + Math.max(64, Math.min(110, h * .11));        // драпировка сверху: видна из-под шапки, но не доходит до логотипа
      if (inner && logo) dc = Math.max(navH + 40, Math.min(dc, inner.offsetTop + logo.offsetTop + logo.offsetHeight * .1 - 6));
      if (inner && facts) {
        [".facts", ".countdown", ".hero__inner .btn"].forEach(function (sel) { var el = $(sel); if (el) side = Math.min(side, inner.offsetLeft + el.offsetLeft); });
        tie = Math.max(8, Math.min(tie, side - 16)); bot = Math.max(10, Math.min(bot, side - 10));
        if (w <= 880) tieY = Math.min(h * .75, Math.max(h * .3, inner.offsetTop + facts.offsetTop - 18));
      }
      return { tie: tie, bot: bot, tieY: tieY, dc: dc };
    }
    function glDraw(o, w, h, dpr, p) {   // p – секунды от начала открытия средних полотен (≤0 – занавес закрыт, большое число – полотен нет, только боковые шторы)
      var g = o.g, U = o.U, fit = o.fit || (o.fit = drapeFit(w, h));
      g.uniform1f(U.uTieW, fit.tie); g.uniform1f(U.uBotW, fit.bot); g.uniform1f(U.uTieY, fit.tieY); g.uniform1f(U.uDc, fit.dc);
      g.viewport(0, 0, o.cv.width, o.cv.height);
      g.uniform2f(U.uRes, w, h); g.uniform1f(U.uP, p);
      g.uniform1f(U.uN, w < 640 ? 5 : 8); g.uniform1f(U.uDpr, dpr);
      g.uniform1f(U.uSw, w < 700 ? 2 : w < 1800 ? 4 : 6);
      g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT); g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    }
    /* Неподвижные шторы первого экрана: шейдер рисует раскрытое состояние один раз на холсте вне страницы,
       картинка копируется в #drapes. На узком экране шторы тоньше (см. finalEdge). */
    var drapes = $("#drapes"), stat = null;
    function drawDrapes() {
      if (!drapes) return;
      var w = hero.clientWidth, h = hero.clientHeight;
      if (!w || !h) return;
      if (stat === null) stat = makeGL(doc.createElement("canvas")) || false;
      if (!stat) return;
      root.classList.add("has-drapes");        // класс расширяет поля первого экрана на телефоне, поэтому ставится до замера
      w = hero.clientWidth; h = hero.clientHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      stat.cv.width = Math.round(w * dpr); stat.cv.height = Math.round(h * dpr);
      stat.fit = null; if (gl) gl.fit = null;   // размеры штор пересчитываются по текущей вёрстке
      glDraw(stat, w, h, dpr, 99);
      drapes.width = stat.cv.width; drapes.height = stat.cv.height;
      drapes.getContext("2d").drawImage(stat.cv, 0, 0);
      stat.cv.width = stat.cv.height = 1;      // большой буфер больше не нужен: картинка уже в #drapes
    }
    /* Холст вступления лежит ровно поверх первого экрана и имеет его размеры (первый экран бывает выше окна).
       Тогда шторы вступления совпадают с неподвижными шторами под ними пиксель в пиксель, и в конце ничего не «подменяется». */
    function sizeCurtain() {
      if (!gl && !ctx && !(gl = makeGL(cv))) ctx = cv.getContext("2d");
      cdpr = Math.min(window.devicePixelRatio || 1, gl ? 2 : 1.5); cw = hero.clientWidth || window.innerWidth; ch = hero.clientHeight || window.innerHeight;
      var hr = hero.getBoundingClientRect();
      cv.style.left = hr.left + "px"; cv.style.top = hr.top + "px"; cv.style.width = cw + "px"; cv.style.height = ch + "px";
      cv.width = Math.round(cw * cdpr); cv.height = Math.round(ch * cdpr);
      if (gl) gl.fit = null; else ctx.setTransform(cdpr, 0, 0, cdpr, 0, 0);
    }
    function drawCurtain(t) {            // t – секунды от начала открытия (≤0 – закрыт)
      if (gl) { glDraw(gl, cw, ch, cdpr, t); return; }
      // запасной путь без WebGL: плоские складки уходят к кулисам .wing
      var W = cw, H = ch, N = W < 640 ? 9 : 14, M = 20, wing = W <= 880 ? 2 : Math.max(16, Math.min(150, W * .09)), half = W / 2 + 1, minW = wing / N;
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
        // каждая складка – столбик из M трапеций со своим градиентом, чтобы объём шёл за изгибом ткани
        for (j = 0; j < N; j++) for (m = 0; m < M; m++) {
          var xa = (E[j][m] + E[j][m + 1]) / 2, xb = (E[j + 1][m] + E[j + 1][m + 1]) / 2, g = ctx.createLinearGradient(xa, 0, Math.max(xb, xa + .5), 0);
          g.addColorStop(0, "#3d0000"); g.addColorStop(.28, "#AF0000"); g.addColorStop(.5, "#d2372d"); g.addColorStop(.72, "#AF0000"); g.addColorStop(1, "#360000");
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
        // тень от кромки на сцену
        var sx = lead[M >> 1], sg = ctx.createLinearGradient(sx, 0, sx + 90, 0); sg.addColorStop(0, "rgba(0,0,0,.42)"); sg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.moveTo(lead[0] + 3, 0); for (m = 1; m <= M; m++) ctx.lineTo(lead[m] + 3, H * m / M);
        for (m = M; m >= 0; m--) ctx.lineTo(lead[m] + 93, H * m / M); ctx.closePath(); ctx.fillStyle = sg; ctx.fill();
        ctx.restore();
      }
    }

    /* Цилиндр с логотипами. Основной путь – один WebGL-холст: фрагментный шейдер для каждого пикселя находит точку
       на поверхности цилиндра и берёт цвет из текстуры логотипа (половина окружности – форум, вторая – CCI).
       Это один слой вместо 36, поэтому вращение почти ничего не стоит. Без WebGL – запасной вариант на CSS-полосах. */
    var ring = (function () {
      var holder = $(".ring3d"), spinEl = $("#ringSpin");
      var base = $(".logo3d__fallback", logo).src.replace(/[^/]+$/, "");
      function buildStrips() {             // запасной путь: 36 прозрачных полос, вращение – CSS-анимация ring-spin
        var N = 18, html = "", k;
        for (var f = 0; f < 2; f++) for (k = 0; k < N; k++) html += '<i class="f' + f + '" style="--i:' + k + ';--a:' + ((k + .5) * 180 / N - 90 + f * 180).toFixed(2) + '"></i>';
        spinEl.innerHTML = html;
        ["horeca-forum-2026-red.png", "cci-color.png"].forEach(function (n) { var im = new Image(); im.src = base + n; });
        return null;
      }
      var cvs = doc.createElement("canvas"), g = null, U = {}, prog;
      try { g = cvs.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" }); } catch (e) {}
      if (!g) return buildStrips();
      var FS = [
        "precision highp float;",
        "uniform vec2 uSize, uA, uB; uniform float uDpr, uR, uRot;",
        "uniform sampler2D uLogo, uCci;",
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
        "    c = texture2D(uLogo, uv) * inside(uv);",
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
        ["uSize", "uA", "uB", "uDpr", "uR", "uRot", "uLogo", "uCci"].forEach(function (n) { U[n] = g.getUniformLocation(prog, n); });
      } catch (e) { return buildStrips(); }
      holder.innerHTML = ""; holder.appendChild(cvs); holder.classList.add("is-gl");

      // текстуры: картинка растягивается до 1024×1024, чтобы работало сглаживание при уменьшении (mipmap)
      var loaded = 0;
      [["uLogo", "horeca-forum-2026-red.png"], ["uCci", "cci-color.png"]].forEach(function (d, unit) {
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

      var mode = "hidden", t = 0, running = false, last = 0, raf = 0, onScreen = true, W = 0, H = 0, dpr = 1;
      var RK = parseFloat(getComputedStyle(logo).getPropertyValue("--rk")) || .4;
      function size() {
        var r = holder.getBoundingClientRect(); if (!r.width) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height;
        var cwid = Math.round(W * dpr), chei = Math.round(H * dpr);
        if (cvs.width !== cwid || cvs.height !== chei) { cvs.width = cwid; cvs.height = chei; g.viewport(0, 0, cwid, chei); }
      }
      function angle() {                   // градусы поворота; отрицательные – по часовой стрелке (вид сверху)
        if (mode === "rest") { var tau = t - 1.2, w = 24; if (tau <= 0) return 0; return tau < 2.5 ? -.5 * w * tau * tau / 2.5 : -30 - w * (tau - 2.5); }   // пауза, разгон, ровное вращение
        return 0;
      }
      function draw() {
        if (loaded < 2 || !W) return;
        g.uniform2f(U.uSize, W, H); g.uniform1f(U.uDpr, dpr); g.uniform1f(U.uR, W * RK);
        g.uniform2f(U.uA, W, H); g.uniform2f(U.uB, W * .94, W * .94 / 1.779);
        g.uniform1f(U.uRot, angle() * Math.PI / 180);
        g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT); g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
      }
      var tick = 0;
      function frame(now) {
        raf = 0; if (!running) return;
        t += Math.min((now - last) / 1000, .1) / SLOW; last = now; draw();
        // разгон идёт на полной частоте; ровное медленное вращение рисуется через кадр (около 30 раз в секунду) –
        // на глаз то же самое, а страница вдвое реже пересобирает кадр
        if (mode === "rest" && t > 3.7) { tick = setTimeout(function () { tick = 0; if (running) raf = requestAnimationFrame(frame); }, 18); }
        else raf = requestAnimationFrame(frame);
      }
      function start() { if (running || mode === "hidden" || !onScreen || doc.hidden || reduced) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } if (tick) { clearTimeout(tick); tick = 0; } }
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) start(); else stop(); }).observe(holder);
      doc.addEventListener("visibilitychange", function () { if (doc.hidden) stop(); else start(); });
      window.addEventListener("resize", function () { size(); draw(); });
      return { rest: function () { mode = "rest"; t = 0; size(); draw(); start(); } };   // пауза лицом к зрителю, затем вращение
    })();

    /* ---------- Запуск ---------- */
    function finish() {                  // мгновенно в конечное состояние (пропуск, страховка, повторный заход)
      if (introDone) return; introDone = true;
      timers.forEach(clearTimeout); timers = [];
      hideCurtain(false); root.classList.add("stage-lit"); unbind();
    }
    var skipEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
    function unbind() { skipEvents.forEach(function (ev) { window.removeEventListener(ev, finish); }); }

    var drapesTimer = 0;
    drawDrapes(); window.addEventListener("load", drawDrapes);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(drawDrapes);     // шрифт меняет высоту блоков, а шторы подогнаны под них
    window.addEventListener("resize", function () { clearTimeout(drapesTimer); drapesTimer = setTimeout(drawDrapes, 150); });
    // первый экран сразу в готовом виде: занавес открывает уже собранную сцену
    logo.classList.add("is-final"); if (ring) ring.rest(); showRest();
    var seen = false, force = /\bintro=1\b/.test(location.search);
    try { seen = sessionStorage.getItem("curtainSeen") === "1"; } catch (e) {}
    if (reduced || (seen && !force)) { finish(); return; }          // повторный заход и «меньше движения»: без занавеса
    try { sessionStorage.setItem("curtainSeen", "1"); } catch (e) {}
    root.classList.add("curtain-closed"); sizeCurtain(); drawCurtain(0); curtain.classList.add("is-drawn");
    window.addEventListener("resize", sizeCurtain);
    skipEvents.forEach(function (ev) { window.addEventListener(ev, finish, { passive: true }); });
    var start = performance.now(), T_END = gl ? 1.9 : 2.6, FIXT = parseFloat((location.search.match(/[?&]ct=([\d.]+)/) || [])[1]);
    (function loop(now) {
      if (introDone) return;
      var t = (((now || performance.now()) - start) / SLOW - T_OPEN) / 1000;
      if (!isNaN(FIXT)) { drawCurtain(FIXT); requestAnimationFrame(loop); return; }   // отладка: ?intro=1&ct=0.8 – занавес стоит на 0,8-й секунде раскрытия
      if (hero.clientWidth !== cw || hero.clientHeight !== ch) { sizeCurtain(); drawDrapes(); }   // вёрстка изменилась (догрузился шрифт): оба слоя пересчитываются вместе
      drawCurtain(t);
      if (t > T_END) { introDone = true; unbind(); hideCurtain(true); return; }     // полотна ушли: слой вступления гаснет, под ним те же шторы первого экрана
      requestAnimationFrame(loop);
    })();
    later(function () { root.classList.add("stage-lit"); }, T_OPEN);
    later(function () { if (ring) ring.rest(); }, T_OPEN + 1000);     // пауза перед вращением отсчитывается заново: логотип стоит лицом, пока занавес не раскрылся
    later(function () { root.classList.remove("curtain-closed"); }, T_OPEN + 1500);
    setTimeout(finish, 9000 * SLOW);            // страховка: страница всегда приходит в готовый вид
  })();
})();
