"""Собирает data/event.kz.js – словарь «русская строка → казахская» – из файлов заказчика.

Источники читаются по порядку, более поздний файл главнее раннего:
  1. horeca_forum_kz_prompt.md            – полный перевод сайта (27.11);
  2. horeca_forum_kz_menu_prompt.md       – утверждённый заказчиком казахский текст страницы меню (разделы, блюда, строки «Аллерген: …»);
  3. horeca_forum_final_edits_prompt.md   – финальные правки (27.11 вечер): новое время, новый спикер, правки текстов.
     По финальным правкам в казахском меню 11 блюд, как в русском: две строки файла меню с пометкой «нет в RU» не используются.

Казахский текст берётся из файлов как есть, вручную ничего не перепечатывается и не переводится.
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
SOURCES = ["horeca_forum_kz_prompt.md", "horeca_forum_kz_menu_prompt.md", "horeca_forum_final_edits_prompt.md"]
SKIP = {"пусто", "нет", "—", "-"}          # «значения нет» в таблицах правок

pairs = {}
dish_allergens = {}        # русское блюдо → русская строка аллергенов (из первого файла): по ней находим пару для казахской строки аллергенов
skipped = []


def norm(s):
    return re.sub(r"\s+", " ", s.replace("\u00a0", " ")).strip()


def tables(text):
    """Таблицы markdown: список (заголовок, строки)."""
    out, header, rows = [], None, []
    for line in text.splitlines() + [""]:
        if not line.startswith("|"):
            if header:
                out.append((header, rows))
            header, rows = None, []
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", c) for c in cells):
            continue
        if header is None:
            header = cells
        else:
            rows.append(cells)
    return out


for name in SOURCES:
    local, conflicts = {}, []

    def add(ru, kz):
        ru, kz = norm(ru), norm(kz)
        if not ru or not kz or ru in SKIP:
            return
        # в файле логотип форума обозначен словами, в данных сайта – меткой [logo]
        ru, kz = ru.replace("[логотип форума]", "[logo]"), kz.replace("[логотип форума]", "[logo]")
        if ru in local and local[ru] != kz:
            conflicts.append((ru, local[ru], kz))
        local[ru] = kz

    fragments = []
    for header, rows in tables((here / name).read_text(encoding="utf-8")):
        ru_cols = [i for i, h in enumerate(header) if h.startswith("RU")]
        kz_cols = [i for i, h in enumerate(header) if h.startswith("KZ")]
        if "RU (для сопоставления)" in header:
            # таблица блюд из файла меню: русское название дано для поиска блюда (иногда обрезано многоточием), перевода аллергенов на русский в ней нет
            r, kd, ka = header.index("RU (для сопоставления)"), header.index("KZ блюдо"), header.index("KZ строка аллергенов")
            for cells in rows:
                cells = cells + [""] * (len(header) - len(cells))
                if norm(cells[r]) == "нет в RU":
                    skipped.append(norm(cells[kd]))
                    continue
                key = norm(cells[r]).rstrip("…")
                hit = [d for d in dish_allergens if d.startswith(key)]
                assert len(hit) == 1, (cells[r], hit)
                add(hit[0], cells[kd])
                if norm(cells[ka]):
                    assert dish_allergens[hit[0]], hit[0]
                    add(dish_allergens[hit[0]], cells[ka])
                else:
                    assert not dish_allergens[hit[0]], hit[0]
        elif ru_cols and len(ru_cols) == len(kz_cols):
            if len(ru_cols) == 2 and "аллерген" in header[ru_cols[1]].lower():
                for cells in rows:
                    cells = cells + [""] * (len(header) - len(cells))
                    dish_allergens[norm(cells[ru_cols[0]])] = norm(cells[ru_cols[1]])
            for cells in rows:
                for r, k in zip(ru_cols, kz_cols):
                    if r < len(cells) and k < len(cells):
                        add(cells[r], cells[k])
        elif header[:3] == ["Версия", "Было", "Стало"]:
            # правка «было → стало»: строка RU и строка KZ. Целая строка – новая пара; кусок в многоточиях – замена внутри уже известной пары.
            by = {c[0]: c for c in rows if len(c) >= 3}
            assert set(by) == {"RU", "KZ"}, (name, list(by))
            ru_old, ru_new, kz_old, kz_new = by["RU"][1], by["RU"][2], by["KZ"][1], by["KZ"][2]
            if ru_new.startswith("…") and ru_new.endswith("…"):
                fragments.append(tuple(norm(x.strip("…")) for x in (ru_old, ru_new, kz_old, kz_new)))
            else:
                add(ru_new, kz_new)
        else:
            raise AssertionError((name, header))
    assert not conflicts, (name, conflicts)
    pairs.update(local)
    for ru_old, ru_new, kz_old, kz_new in fragments:
        hit = [k for k in pairs if ru_old in k]
        assert len(hit) == 1 and kz_old in pairs[hit[0]], (ru_old, hit)
        pairs[hit[0].replace(ru_old, ru_new)] = pairs.pop(hit[0]).replace(kz_old, kz_new)


def put(ru, kz):
    pairs[norm(ru)] = norm(kz)


# «9 декабря 2026, среда · 10:00–16:00» на сайте собирается из двух полей (дата и время) – берём часть до точки-разделителя
for ru, kz in list(pairs.items()):
    if " · " in ru and " · " in kz and re.search(r"\d\d:\d\d", ru):
        a, b = ru.split(" · ", 1)
        c, d = kz.split(" · ", 1)
        if b == d and not a.startswith("Антракт"):
            put(a, c)

# Строка, которой в файлах нет, но перевод для неё в файле есть (решение разработчика, см. README):
# ссылка «← На главную» на странице меню – берём перевод слова «Главная» из шапки.
put("← На главную", "← " + pairs["Главная"])

same = [ru for ru, kz in pairs.items() if ru == kz]
body = json.dumps(pairs, ensure_ascii=False, indent=2)
(root / "data/event.kz.js").write_text(
    "/* КАЗАХСКИЙ ПЕРЕВОД. Файл собран автоматически из файлов заказчика в tools/i18n/ (python3 tools/i18n/build_kz.py) – руками не править.\n"
    "   Слева русская строка сайта, справа её перевод. Чтобы исправить перевод – поправьте файл-источник и пересоберите.\n"
    "   Одинаковые в RU и KZ строки (имена, «Десерт») оставлены нарочно: по ним сверка видит, что строка учтена. */\n"
    "window.EVENT_KZ = " + body + ";\n", encoding="utf-8")
print("пар в словаре:", len(pairs), "| из них одинаковых в RU и KZ:", len(same))
print("блюда файла меню без русской пары (не используются):", skipped)
