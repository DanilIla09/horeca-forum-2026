"""Фото спикеров и ведущего на ровном красном фоне сайта #AF0000: без штор, без теней, без логотипа (решение заказчика 24.11).
Человек в том же кадре и того же размера, что раньше: рамки обрезки прежние.
python compose_flat.py <папка с вырезками> <папка назначения> <превью.jpg>
Вырезки делает cutout.swift, край чистит refine.py. Нужны pillow и numpy."""
import sys
import os
import numpy as np
from PIL import Image

cut_dir, out_dir, preview = sys.argv[1:4]
os.makedirs(out_dir, exist_ok=True)
BG = (175, 0, 0)             # #AF0000 – красный сайта (--red в css/style.css)

# имя → (левый край, верх, ширина кадра в долях исходника; размер холста)
PEOPLE = {
    "dinchel":     ((.10, .03, .80), (600, 800)),
    "yilmaz":      ((.06, .12, .84), (600, 800)),
    "alimkulova":  ((.17, .17, .60), (600, 800)),
    "gomech":      ((.12, .04, .76), (600, 800)),
    "baimuratova": ((.23, .10, .62), (600, 800)),
    "meister":     ((0.0, 40 / 1280, 1.0), (840, 1120)),
    # фото из архива от 24.11. Рамка считается от лица: ширина лица ≈ 38% кадра, верх лица на 21% высоты (как у остальных).
    "useinov":     ((171 / 1254, 0.0, 940 / 1254), (600, 800)),      # исходник квадратный и крупный: кадр плотнее, чем у остальных
    "kazantsev":   ((173 / 1333, 275 / 2000, 910 / 1333), (600, 800)),
    "ertin":       ((103 / 540, 38 / 540, 368 / 540), (600, 800)),
    "basentsyan":  ((0.0, 0.0, 806 / 941), (600, 800)),              # шляпа: кадр от верхнего края фото
}

tiles = []
for name, ((cx, cy, cw), (W, H)) in PEOPLE.items():
    src = os.path.join(cut_dir, name + ".png")
    if not os.path.exists(src):                 # собираем только тех, чьи вырезки лежат в папке
        print(f"{name:12s} пропуск: нет вырезки")
        continue
    cut = Image.open(src).convert("RGBA")
    a = np.array(cut)
    if name == "dinchel":                       # ноутбук в левом нижнем углу и край кресла справа – не часть человека
        rgb = a[..., :3].astype(np.int32)
        luma = rgb.mean(axis=2)
        sat = rgb.max(axis=2) - rgb.min(axis=2)
        yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
        a[(xx < 190) & (yy > 780) & (luma > 78) & (sat < 34), 3] = 0
        a[(xx < 60) & (yy > 800), 3] = 0
        a[(xx > 772) & (yy > 900), 3] = 0
        cut = Image.fromarray(a, "RGBA")
    sw, sh = cut.size
    x0, y0, w = round(sw * cx), round(sh * cy), round(sw * cw)
    h = round(w * H / W)
    assert x0 + w <= sw + 1 and y0 + h <= sh + 1, (name, x0 + w, sw, y0 + h, sh)
    person = cut.crop((x0, y0, x0 + w, y0 + h)).resize((W, H), Image.LANCZOS)
    bg = Image.new("RGBA", (W, H), BG + (255,))
    bg.alpha_composite(person)
    out = bg.convert("RGB")
    path = os.path.join(out_dir, name + ".jpg")
    out.save(path, quality=90, subsampling=0, optimize=True, progressive=True)     # без прореживания цвета: фон остаётся ровно #AF0000
    corner = np.array(out)[:12, :12].reshape(-1, 3)
    print(f"{name:12s} {W}x{H}  {os.path.getsize(path) // 1024} КБ  фон в углу после сжатия {corner.mean(0).round(1)}")
    tiles.append(out.resize((300, 400)))

sheet = Image.new("RGB", (310 * len(tiles), 410), (20, 20, 20))
for i, t in enumerate(tiles):
    sheet.paste(t, (i * 310 + 5, 5))
sheet.save(preview, quality=88)
