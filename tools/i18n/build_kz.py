"""Собирает data/event.kz.js – словарь «русская строка → казахская» – из файла заказчика horeca_forum_kz_prompt.md.

Казахский текст берётся из файла как есть, вручную ничего не перепечатывается и не переводится.
Сайт остаётся на русских данных (data/event.js и разметка); при выборе KZ скрипт js/lang.js подменяет каждую строку,
для которой в словаре есть пара. Поэтому русская строка на сайте должна совпадать с колонкой RU файла буква в букву.

python3 tools/i18n/build_kz.py            – собрать словарь
node tools/i18n/check_kz.js               – сверка: что на сайте без перевода и какие строки файла не нашлись
"""
import json
import pathlib
import re

here = pathlib.Path(__file__).resolve().parent
root = here.parent.parent
src = (here / "horeca_forum_kz_prompt.md").read_text(encoding="utf-8")

pairs = {}
conflicts = []


def norm(s):
    return re.sub(r"\s+", " ", s.replace("\u00a0", " ")).strip()


def add(ru, kz):
    ru, kz = norm(ru), norm(kz)
    if not ru or not kz:
        return
    # в файле логотип форума обозначен словами, в данных сайта – меткой [logo]
    ru, kz = ru.replace("[логотип форума]", "[logo]"), kz.replace("[логотип форума]", "[logo]")
    if ru in pairs and pairs[ru] != kz:
        conflicts.append((ru, pairs[ru], kz))
    pairs[ru] = kz


header = None
for line in src.splitlines():
    if not line.startswith("|"):
        header = None
        continue
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    if all(re.fullmatch(r":?-{3,}:?", c) for c in cells):
        continue
    if header is None:
        header = cells
        continue
    ru_cols = [i for i, h in enumerate(header) if h.startswith("RU")]
    kz_cols = [i for i, h in enumerate(header) if h.startswith("KZ")]
    assert len(ru_cols) == len(kz_cols) >= 1, header
    for r, k in zip(ru_cols, kz_cols):
        if r < len(cells) and k < len(cells):
            add(cells[r], cells[k])

# «9 декабря 2026, среда · 10:00–16:00» на сайте собирается из двух полей (дата и время) – берём часть до точки-разделителя
for ru, kz in list(pairs.items()):
    if " · " in ru and " · " in kz and re.search(r"\d\d:\d\d", ru):
        a, b = ru.split(" · ", 1)
        c, d = kz.split(" · ", 1)
        if b == d:
            add(a, c)

# Строки, которых в файле нет в таком виде, но перевод для них в файле есть (решения разработчика, см. README):
#  – должность Толги Гомеча в программе на сайте с «Pizza» (указание заказчика 27.11 после файла); перевод – из строки файла без «Pizza»;
#  – ссылка «← На главную» на странице меню: берём перевод слова «Главная» из шапки.
EXTRA = {
    "Директор по международному бизнесу Domino’s Pizza": pairs["Директор по международному бизнесу Domino’s"],
    "← На главную": "← " + pairs["Главная"],
}
for ru, kz in EXTRA.items():
    add(ru, kz)

assert not conflicts, conflicts
same = [ru for ru, kz in pairs.items() if ru == kz]
out = dict(pairs)          # одинаковые в RU и KZ строки (имена, «Десерт») тоже остаются в словаре: по ним сверка видит, что строка учтена
body = json.dumps(out, ensure_ascii=False, indent=2)
(root / "data/event.kz.js").write_text(
    "/* КАЗАХСКИЙ ПЕРЕВОД. Файл собран автоматически из tools/i18n/horeca_forum_kz_prompt.md (python3 tools/i18n/build_kz.py) – руками не править.\n"
    "   Слева русская строка сайта, справа её перевод. Чтобы исправить перевод – поправьте файл-источник и пересоберите. */\n"
    "window.EVENT_KZ = " + body + ";\n", encoding="utf-8")
print("пар в словаре:", len(out), "| из них одинаковых в RU и KZ:", len(same))
