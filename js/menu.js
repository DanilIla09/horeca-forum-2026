/* Страница «Банкетное меню». Данные: data/event.js (window.EVENT_DATA.menu). */
(function () {
  "use strict";
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
