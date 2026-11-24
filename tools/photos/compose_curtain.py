"""Фото спикеров и ведущего на фоне штор (просьба клиента из презентации от 18.11): красный бархат в складках, без логотипа.
Человек в том же кадре и того же размера, что раньше: рамки обрезки прежние. Шторы – часть самого снимка, анимации в рамке нет.
python compose_curtain.py <папка с вырезками> <папка назначения> <превью.jpg>
Вырезки делает cutout.swift (человек на прозрачном фоне, PNG). Нужны pillow и numpy."""
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
# Бархат: тень в складке → основной красный сайта (#AF0000) → блик на гребне складки.
DARK, MID, HI = np.array([66, 0, 0.]), np.array([175, 0, 0.]), np.array([224, 44, 38.])   # середина – красный сайта #AF0000
FOLDS = 6.4          # сколько складок помещается по ширине кадра


def backdrop(W, H, seed=7):
    """Шторы: вертикальные складки разной ширины, свет слева-спереди, сверху и по краям темнее."""
    k = 2                                             # рисуем вдвое крупнее и уменьшаем: края складок без ступенек
    w, h = W * k, H * k
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    x /= w
    y /= h
    ph = rng.uniform(0, 6.283, 6)
    # складки неодинаковой ширины и слегка «гуляют» по высоте, как у настоящей ткани
    u = x * FOLDS + .22 * np.sin(6.283 * (x * 1.3) + ph[0]) + .12 * np.sin(6.283 * (x * 2.9) + ph[1]) \
        + .035 * np.sin(6.283 * (y * 1.1 + x * .7) + ph[2]) + .02 * np.sin(6.283 * (y * 2.3) + ph[3] + x * 9)
    rel = .5 - .5 * np.cos(6.283 * u)                 # профиль складки: 0 – впадина, 1 – гребень
    rel = rel ** .7 + .10 * np.sin(6.283 * (u * 2.0) + ph[4]) + .05 * np.sin(6.283 * (u * 3.0) + ph[5])
    slope = np.gradient(rel, axis=1) * w / FOLDS      # наклон поверхности поперёк складки
    nx = -slope * .55
    nz = 1.0 / np.sqrt(nx * nx + 1.0)
    nx *= nz
    lx, lz = -.50, .866                               # свет слева-спереди
    diff = np.clip(nx * lx + nz * lz, 0, 1)
    occ = np.clip((rel - rel.min()) / (rel.max() - rel.min()), 0, 1)   # во впадинах темнее
    t = (.16 + .84 * diff ** 1.5) * (.42 + .58 * occ)
    t = t + .16 * np.clip(diff - .9, 0, 1) / .1 * occ ** 3            # узкий блик на гребне
    # общий свет: мягкое пятно за человеком, сверху и по краям темнее
    spot = np.exp(-(((x - .5) / .55) ** 2 + ((y - .40) / .60) ** 2))
    t *= .70 + .46 * spot
    t *= 1 - .28 * np.clip((.16 - y) / .16, 0, 1) - .16 * np.clip((y - .82) / .18, 0, 1)
    t = np.clip(t, 0, 1)[..., None]
    k1 = np.clip(t / .55, 0, 1)
    k2 = np.clip((t - .55) / .45, 0, 1)
    img = DARK * (1 - k1) + MID * k1
    img = img * (1 - k2) + HI * k2
    img += rng.normal(0, 2.2, (h, w, 1))              # лёгкое зерно ткани
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").resize((W, H), Image.LANCZOS)
    return im.filter(ImageFilter.GaussianBlur(W * .0022)).convert("RGBA")   # фон чуть не в фокусе: человек отделяется


tiles = []
for name, ((cx, cy, cw), (W, H)) in PEOPLE.items():
    cut = Image.open(os.path.join(cut_dir, name + ".png")).convert("RGBA")
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
    bg = backdrop(W, H)
    sil = Image.new("L", (W, H), 0)
    sil.paste(person.getchannel("A"), (round(W * .018), round(H * .014)))
    shadow = Image.new("RGBA", (W, H), (40, 0, 4, 0))
    shadow.putalpha(sil.filter(ImageFilter.GaussianBlur(W * .035)).point(lambda v: int(v * .6)))
    bg.alpha_composite(shadow)
    bg.alpha_composite(person)
    out = bg.convert("RGB")
    path = os.path.join(out_dir, name + ".jpg")
    out.save(path, quality=86, optimize=True, progressive=True)
    print(f"{name:12s} {W}x{H}  {os.path.getsize(path) // 1024} КБ")
    tiles.append(out.resize((300, 400)))

empty = backdrop(600, 800).convert("RGB")       # рамка для спикера без фото: те же шторы, поверх инициалы
empty.save(os.path.join(out_dir, "stage-empty.jpg"), quality=86, optimize=True, progressive=True)
tiles.append(empty.resize((300, 400)))
sheet = Image.new("RGB", (310 * len(tiles), 410), (20, 20, 20))
for i, t in enumerate(tiles):
    sheet.paste(t, (i * 310 + 5, 5))
sheet.save(preview, quality=88)
