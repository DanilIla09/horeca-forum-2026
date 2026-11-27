/* Сверка казахского перевода: какие видимые русские строки сайта остались без перевода и какие строки словаря на сайте не встречаются.
   node tools/i18n/check_kz.js */
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "../..");
global.window = {};
require(path.join(root, "data/event.js"));
require(path.join(root, "data/event.kz.js"));
const D = window.EVENT_DATA, KZ = window.EVENT_KZ;
const norm = s => String(s).replace(/\s+/g, " ").trim();
const cyr = s => /[А-Яа-яЁё]/.test(s);
const used = new Set(), missing = [];
const see = (s, where) => { const k = norm(s); if (!k) return; if (k in KZ) used.add(k); else if (cyr(k)) missing.push(where + ": " + k); };

(function walk(o, p) {
  for (const k in o) {
    if (typeof o[k] === "string") { if (!/^(photo|logo|route2gis|routeGoogle|scheme|startsAt|endsAt)$/.test(k)) see(o[k], "данные " + p + k); }
    else if (o[k] && typeof o[k] === "object") walk(o[k], p + k + ".");
  }
})(D, "");

const plain = [];
for (const page of ["index.html", "menu.html"]) {
  const html = fs.readFileSync(path.join(root, page), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  for (const m of html.matchAll(/<[^>]+\sdata-i18n[^>]*>([^<]*)</g)) see(m[1], page);
  for (const m of html.matchAll(/>([^<>]*[А-Яа-яЁё][^<>]*)</g)) { const t = norm(m[1]); if (!(t in KZ)) plain.push(page + " текст: " + t); }
  for (const m of html.matchAll(/(?:aria-label|alt|content)="([^"]*[А-Яа-яЁё][^"]*)"/g)) plain.push(page + " атрибут: " + norm(m[1]));
  const title = html.match(/<title>([^<]*)<\/title>/); if (title && cyr(title[1])) plain.push(page + " title: " + norm(title[1]));
}
for (const f of ["js/app.js", "js/menu.js"]) {
  const js = fs.readFileSync(path.join(root, f), "utf8");
  for (const m of js.matchAll(/T\("([^"]+)"\)/g)) see(m[1], f);
  for (const line of js.split("\n")) {
    const code = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
    for (const m of code.matchAll(/["']([^"'<>]*[А-Яа-яЁё][^"'<>]*)["']/g)) if (!code.includes('T("' + m[1] + '")')) plain.push(f + " строка: " + norm(m[1]));
  }
}
const unused = Object.keys(KZ).filter(k => !used.has(k));
console.log("Пар в словаре: " + Object.keys(KZ).length + ", из них используются на сайте: " + used.size);
console.log("\nДанные и размеченные элементы БЕЗ перевода (" + missing.length + "):\n  " + (missing.join("\n  ") || "нет"));
console.log("\nСтроки словаря, которых НЕТ на сайте (" + unused.length + "):\n  " + (unused.join("\n  ") || "нет"));
console.log("\nПрочие русские тексты сайта без перевода (title, meta, alt, подписи для читалок, служебные) (" + [...new Set(plain)].length + "):\n  " + [...new Set(plain)].join("\n  "));
