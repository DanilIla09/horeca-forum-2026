"""Фото спикеров на общем ровном фоне #BEAC9E – цвет прислал заказчик 27.11 («как у Тарлана»).
Вырезки людей (PNG с прозрачностью) делают дизайнеры заказчика; кадр – как на прежних фото: лицо ≈ 38–43% ширины кадра.

python -I compose_backdrop.py <папка с вырезками> <assets/speakers> <превью.jpg> [#RRGGBB]
Имена вырезок: alimkulova.png, baimuratova.png, beisekeeva.png, dinchel.png, gomech.png, kazantsev.png, useinov.png, yilmaz.png.
Нужны pillow и numpy.
"""
import os
import sys

from PIL import Image

cut_dir, out_dir, preview = sys.argv[1:4]
color = sys.argv[4] if len(sys.argv) > 4 else "#BEAC9E"
BG = tuple(int(color.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))

# имя → (левый край, верх, ширина кадра в долях вырезки; размер холста)
PEOPLE = {
    "dinchel":     ((.18, .06, .66), (600, 800)),          # кадр выше стола: ноутбук и блокнот в него не попадают
    "yilmaz":      ((.098, .115, .77), (600, 800)),
    "alimkulova":  ((.2346, .1875, .5625), (600, 800)),
    "gomech":      ((.12, .04, .76), (600, 800)),
    "useinov":     ((171 / 1254, 0.0, 940 / 1254), (600, 800)),
    "baimuratova": ((.287, .123, .523), (600, 800)),
    "kazantsev":   ((173 / 1333, 275 / 2000, 910 / 1333), (600, 800)),
    "beisekeeva":  ((.199, 0.0, .56), (600, 800)),            # исходник горизонтальный: кадр на всю высоту вырезки
}

os.makedirs(out_dir, exist_ok=True)
tiles = []
for name, ((cx, cy, cw), (W, H)) in PEOPLE.items():
    src = os.path.join(cut_dir, name + ".png")
    if not os.path.exists(src):
        print(f"{name:12s} пропуск: нет вырезки")
        continue
    cut = Image.open(src).convert("RGBA")
    sw, sh = cut.size
    x0, y0, w = round(sw * cx), round(sh * cy), round(sw * cw)
    h = round(w * H / W)
    assert x0 + w <= sw + 1 and y0 + h <= sh + 1, (name, x0 + w, sw, y0 + h, sh)
    person = cut.crop((x0, y0, x0 + w, y0 + h)).resize((W, H), Image.LANCZOS)
    bg = Image.new("RGBA", (W, H), BG + (255,))
    bg.alpha_composite(person)
    out = bg.convert("RGB")
    path = os.path.join(out_dir, name + ".jpg")
    out.save(path, quality=90, subsampling=0, optimize=True, progressive=True)     # без прореживания цвета: фон остаётся ровным
    print(f"{name:12s} {W}x{H}  {os.path.getsize(path) // 1024} КБ  фон в углу {out.getpixel((4, 4))}")
    tiles.append(out.resize((300, 400)))

sheet = Image.new("RGB", (310 * len(tiles), 410), (20, 20, 20))
for i, t in enumerate(tiles):
    sheet.paste(t, (5 + 310 * i, 5))
sheet.save(preview, quality=90)
