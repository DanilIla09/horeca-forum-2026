/* Язык сайта: русский (по умолчанию) или казахский. Подключается после data/event.js и data/event.kz.js, до app.js / menu.js.
   Русские тексты – в data/event.js и в разметке; data/event.kz.js – словарь «русская строка → казахская».
   При KZ подменяются все строки данных и элементы с атрибутом data-i18n, для которых в словаре есть пара.
   Выбор хранится в браузере (localStorage); ссылка с ?lang=kz или ?lang=ru открывает сайт сразу на нужном языке. */
(function () {
  "use strict";
  var doc = document, KZ = window.EVENT_KZ || null, lang = null, store = true;
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  try { lang = window.localStorage.getItem("lang"); } catch (e) { store = false; }
  var q = window.location.search.match(/[?&]lang=(kz|kk|ru)\b/);
  if (q) { lang = q[1] === "ru" ? "ru" : "kz"; try { window.localStorage.setItem("lang", lang); } catch (e) { store = false; } }
  if (lang !== "kz" || !KZ) lang = "ru";
  var dict = lang === "kz" ? KZ : {};
  var norm = function (s) { return String(s).replace(/\s+/g, " ").trim(); };
  window.LANG = lang;
  window.T = function (s) { var k = norm(s); return has(dict, k) ? dict[k] : s; };

  if (lang === "kz") {
    doc.documentElement.lang = "kk";
    (function walk(o) {                                   // все строки данных: есть перевод – подменяем
      for (var k in o) if (has(o, k)) {
        if (typeof o[k] === "string") o[k] = window.T(o[k]);
        else if (o[k] && typeof o[k] === "object") walk(o[k]);
      }
    })(window.EVENT_DATA || {});
    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n]"), function (el) { el.textContent = window.T(el.textContent); });
  }

  /* Переключатель RU / KZ в шапке: запоминаем выбор и перечитываем страницу (она собирается из данных при загрузке). */
  Array.prototype.forEach.call(doc.querySelectorAll("[data-lang]"), function (b) {
    var mine = b.getAttribute("data-lang");
    b.classList.toggle("is-active", mine === lang); b.setAttribute("aria-pressed", mine === lang ? "true" : "false");
    b.addEventListener("click", function () {
      if (mine === lang) return;
      try { window.localStorage.setItem("lang", mine); } catch (e) { store = false; }
      var s = window.location.search.replace(/([?&])lang=[^&]*(&|$)/, function (m, a, z) { return z ? a : ""; });
      if (!store) s += (s ? "&" : "?") + "lang=" + mine;            // хранилище недоступно – язык передаём в адресе
      if (s !== window.location.search) { window.location.search = s; return; }
      window.location.reload();
    });
  });
})();
