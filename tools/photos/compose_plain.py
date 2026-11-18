"""Фото спикеров на чистом красном фоне, без логотипа (комментарий клиента 18.11).
Человек в том же кадре и того же размера, что раньше: рамки обрезки прежние.
python compose_plain.py <папка с вырезками> <папка назначения> <превью.jpg>"""
import sys
import os
import numpy as np
from PIL import Image, ImageFilter

cut_dir, out_dir, preview = sys.argv[1:4]
os.makedirs(out_dir, exist_ok=True)

# имя → (левый край, верх, ширина кадра в долях исходника; размер холста)
PEOPLE = {
    "dinchel":     ((.10, .03, .80), (600, 800)),
    "yilmaz":      ((.06, .12, .84), (600, 800)),
    "alimkulova":  ((.17, .17, .60), (600, 800)),
    "gomech":      ((.12, .04, .76), (600, 800)),
    "baimuratova": ((.23, .10, .62), (600, 800)),
    "meister":     ((0.0, 40 / 1280, 1.0), (840, 1120)),
}
# Красный Coca-Cola: светлее в центре, чуть глубже к краям. Без ухода в бордо.
C0, C1, C2 = np.array([238, 44, 54.]), np.array([222, 26, 38.]), np.array([186, 16, 28.])


def backdrop(W, H):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((x - W * .5) / (W * .70)) ** 2 + ((y - H * .42) / (H * .66)) ** 2)
    t = np.clip(d, 0, 1.2) / 1.2
    k1 = np.clip(t / .6, 0, 1)[..., None]
    k2 = np.clip((t - .6) / .4, 0, 1)[..., None]
    img = C0 * (1 - k1) + C1 * k1
    img = img * (1 - k2) + C2 * k2
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").convert("RGBA")


tiles = []
for name, ((cx, cy, cw), (W, H)) in PEOPLE.items():
    cut = Image.open(os.path.join(cut_dir, name + ".png")).convert("RGBA")
    a = np.array(cut)
    if name == "dinchel":                       # ноутбук в левом нижнем углу и край кресла справа — не часть человека
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
    bg = backdrop(W, H)
    sil = Image.new("L", (W, H), 0)
    sil.paste(person.getchannel("A"), (round(W * .015), round(H * .012)))
    shadow = Image.new("RGBA", (W, H), (70, 0, 8, 0))
    shadow.putalpha(sil.filter(ImageFilter.GaussianBlur(W * .03)).point(lambda v: int(v * .5)))
    bg.alpha_composite(shadow)
    bg.alpha_composite(person)
    out = bg.convert("RGB")
    path = os.path.join(out_dir, name + ".jpg")
    out.save(path, quality=86, optimize=True, progressive=True)
    print(f"{name:12s} {W}x{H}  {os.path.getsize(path) // 1024} КБ")
    tiles.append(out.resize((300, 400)))

empty = backdrop(600, 800).convert("RGB")
empty.save(os.path.join(out_dir, "stage-empty.jpg"), quality=86, optimize=True, progressive=True)
tiles.append(empty.resize((300, 400)))
sheet = Image.new("RGB", (310 * len(tiles), 410), (20, 20, 20))
for i, t in enumerate(tiles):
    sheet.paste(t, (i * 310 + 5, 5))
sheet.save(preview, quality=86)
