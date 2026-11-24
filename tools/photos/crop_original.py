"""Фото спикеров и ведущего из оригиналов: только обрезка под рамку 3:4, без вырезки и без замены фона (решение заказчика 24.11).
Кадр тот же, что был раньше: те же рамки обрезки в долях исходника.
python crop_original.py <папка с оригиналами> <папка назначения> <превью.jpg>
В папке с оригиналами файлы названы по ключу: dinchel.jpg, yilmaz.png, alimkulova.jpg … (расширение любое). Нужен pillow."""
import sys
import os
import glob
from PIL import Image, ImageOps

src_dir, out_dir, preview = sys.argv[1:4]
os.makedirs(out_dir, exist_ok=True)

# имя → (левый край, верх, ширина кадра в долях исходника; размер результата)
PEOPLE = {
    "dinchel":     ((.10, .03, .80), (600, 800)),
    "yilmaz":      ((.06, .12, .84), (600, 800)),
    "alimkulova":  ((.17, .17, .60), (600, 800)),
    "gomech":      ((.12, .04, .76), (600, 800)),
    "baimuratova": ((.23, .10, .62), (600, 800)),
    "meister":     ((0.0, 40 / 1280, 1.0), (840, 1120)),
    "useinov":     ((171 / 1254, 0.0, 940 / 1254), (600, 800)),      # исходник квадратный и крупный: кадр плотнее, чем у остальных
    "kazantsev":   ((173 / 1333, 275 / 2000, 910 / 1333), (600, 800)),
    "ertin":       ((103 / 540, 38 / 540, 368 / 540), (600, 800)),   # оригинал на белом фоне
    "basentsyan":  ((0.0, 0.0, 806 / 941), (600, 800)),              # портрет в шляпе: кадр от верхнего края фото
}

tiles = []
for name, ((cx, cy, cw), (W, H)) in PEOPLE.items():
    found = sorted(glob.glob(os.path.join(src_dir, name + ".*")))
    if not found:
        print(f"{name:12s} пропуск: нет оригинала")
        continue
    im = ImageOps.exif_transpose(Image.open(found[0]))
    if im.mode in ("RGBA", "LA", "P"):                     # прозрачный PNG кладём на белое, как в исходнике
        im = im.convert("RGBA")
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
        bg.alpha_composite(im)
        im = bg
    im = im.convert("RGB")
    sw, sh = im.size
    x0, y0, w = round(sw * cx), round(sh * cy), round(sw * cw)
    h = round(w * H / W)
    if y0 + h > sh:                                        # округление: кадр не выходит за нижний край
        h = sh - y0
        w = round(h * W / H)
    assert x0 + w <= sw + 1 and y0 + h <= sh + 1, (name, x0 + w, sw, y0 + h, sh)
    out = im.crop((x0, y0, x0 + w, y0 + h)).resize((W, H), Image.LANCZOS)
    path = os.path.join(out_dir, name + ".jpg")
    out.save(path, quality=88, optimize=True, progressive=True)
    print(f"{name:12s} {sw}x{sh} → {W}x{H}  {os.path.getsize(path) // 1024} КБ")
    tiles.append(out.resize((300, 400)))

sheet = Image.new("RGB", (310 * len(tiles), 410), (20, 20, 20))
for i, t in enumerate(tiles):
    sheet.paste(t, (i * 310 + 5, 5))
sheet.save(preview, quality=88)
