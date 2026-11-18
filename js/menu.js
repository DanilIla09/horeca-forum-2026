/* Страница «Банкетное меню». Данные: data/event.js (window.EVENT_DATA.menu). */
(function () {
  "use strict";
  /* Варианты шрифта для показа клиенту: ?font=2 — заголовки Playfair Display, ?font=3 — Montserrat, ?font=1 — основной (Manrope).
     Выбор держится до закрытия вкладки, чтобы страница меню открывалась тем же шрифтом. */
  (function () {
    var m = /[?&]font=([123])/.exec(location.search), f = m && m[1];
    try { if (f) sessionStorage.setItem("font", f); else f = sessionStorage.getItem("font"); } catch (e) {}
    var fam = { "2": "Playfair+Display:wght@500;600;700;800", "3": "Montserrat:wght@400;500;600;700;800" }[f];
    if (!fam) return;
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=" + fam + "&display=swap";
    document.head.appendChild(l); document.documentElement.setAttribute("data-font", f);
  })();
  var D = window.EVENT_DATA || {}, M = D.menu || {}, doc = document;
  var set = function (id, text) { var el = doc.getElementById(id); if (el) el.textContent = text || ""; };
  set("menuEyebrow", M.eyebrow); set("menuTitle", M.title || "Банкетное меню");
  set("copyright", (D.footer || {}).copyright); set("orgLabel", (D.footer || {}).organizerLabel);
  var list = doc.getElementById("menuList");
  (M.categories || []).forEach(function (c) {
    var sec = doc.createElement("section"); sec.className = "menucat";
    var h = doc.createElement("h2"); h.className = "menucat__title"; h.textContent = c.category; sec.appendChild(h);
    var ul = doc.createElement("ul");
    (c.items || []).forEach(function (it) { var li = doc.createElement("li"); li.textContent = typeof it === "string" ? it : it.name; ul.appendChild(li); });
    sec.appendChild(ul); list.appendChild(sec);
  });
})();
