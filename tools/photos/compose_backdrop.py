"""Фото спикеров на общем студийном фоне «как у Тарлана Усейнова» (просьба заказчика 27.11).

Фон не выдуман: это гладкая модель настоящего фона с фото Усейнова (тёплый бежевый, сверху темнее) –
по пикселям фона подбирается плавная поверхность, человек из расчёта исключается. Само фото Усейнова не трогаем.
Вырезки людей (PNG с прозрачностью) присылают дизайнеры заказчика.

python -I compose_backdrop.py <папка с вырезками> <assets/speakers> <превью.jpg> [#RRGGBB]
Необязательный цвет: если заказчик пришлёт код цвета, фон сдвигается так, чтобы его середина стала этим цветом (перепад светлоты остаётся).
Нужны pillow и numpy.
"""
import os
import sys

import numpy as np
from PIL import Image

cut_dir, out_dir, preview = sys.argv[1:4]
target = sys.argv[4] if len(sys.argv) > 4 else None
REF = os.path.join(out_dir, "useinov.jpg")       # образец фона

# имя → (левый край, верх, ширина кадра в долях вырезки; размер холста). Кадр – как на прежних фото: лицо ≈ 38–42% ширины.
PEOPLE = {
    "alimkulova":  ((.195, .125, .60), (600, 800)),
    "gomech":      ((.12, .04, .76), (600, 800)),
    "kazantsev":   ((173 / 1333, 275 / 2000, 910 / 1333), (600, 800)),
}


def backdrop_model(path):
    """Гладкая поверхность фона: по каждому каналу многочлен 2-й степени от (x, y), подогнанный по пикселям фона."""
    im = np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)
    H, W, _ = im.shape
    yy, xx = np.mgrid[0:H, 0:W]
    x, y = xx / (W - 1) * 2 - 1, yy / (H - 1) * 2 - 1
    A = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], axis=-1)
    mask = ((xx < W * .06) | (xx > W * .94)) & (yy < H * .55) | (yy < H * .03)      # начало: края кадра, где человека нет
    coef = None
    for _ in range(4):
        coef = np.stack([np.linalg.lstsq(A[mask], im[..., c][mask], rcond=None)[0] for c in range(3)], axis=1)
        fit = A @ coef
        mask = (np.abs(im - fit).max(axis=2) < 9) & (yy < H * .75)                    # всё, что близко к модели, – фон
    return coef, float(mask.mean())


def render(coef, W, H, shift):
    yy, xx = np.mgrid[0:H, 0:W]
    x, y = xx / (W - 1) * 2 - 1, yy / (H - 1) * 2 - 1
    A = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], axis=-1)
    return np.clip(A @ coef + shift, 0, 255)


coef, share = backdrop_model(REF)
mid = np.array([1, 0, 0, 0, 0, 0]) @ coef
shift = np.zeros(3)
if target:
    want = np.array([int(target.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)
    shift = want - mid
print("фон по образцу: середина кадра", (mid + shift).round(0), "| доля пикселей фона в образце %.2f" % share)

os.makedirs(out_dir, exist_ok=True)
tiles = [Image.open(REF).convert("RGB").resize((300, 400))]
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
    bg = Image.fromarray(render(coef, W, H, shift).round().astype(np.uint8), "RGB").convert("RGBA")
    bg.alpha_composite(person)
    out = bg.convert("RGB")
    path = os.path.join(out_dir, name + ".jpg")
    out.save(path, quality=90, subsampling=0, optimize=True, progressive=True)
    print(f"{name:12s} {W}x{H}  {os.path.getsize(path) // 1024} КБ")
    tiles.append(out.resize((300, 400)))

sheet = Image.new("RGB", (310 * len(tiles), 410), (20, 20, 20))
for i, t in enumerate(tiles):
    sheet.paste(t, (5 + 310 * i, 5))
sheet.save(preview, quality=90)
