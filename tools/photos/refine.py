"""Чистит край вырезки: убирает светлые пятна старого фона в волосах и ореол по контуру.
Маска от Vision (cutout.swift) грубая: в просветах между прядями остаётся прежний фон. Здесь для полосы вдоль контура
по исходному фото оцениваются два местных цвета – человека (F) и фона (B) – и прозрачность каждого пикселя считается
по тому, к какому из них он ближе. Там, где человек и фон почти одного цвета, остаётся исходная маска.
python refine.py <исходное фото> <вырезка.png> <результат.png> [deep:0.52]      (нужны numpy, pillow, opencv-python-headless)"""
import sys
import numpy as np
import cv2
from PIL import Image, ImageOps

src, cut, out = sys.argv[1:4]
c = np.array(Image.open(cut).convert("RGBA"))
H, W = c.shape[:2]
im0 = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
assert abs(im0.width / im0.height - W / H) < .01, (im0.size, (W, H))       # cutout.swift уменьшает большие фото, пропорции те же
if im0.size != (W, H):
    im0 = im0.resize((W, H), Image.LANCZOS)
img = np.array(im0).astype(np.float32)
m = (c[..., 3] > 127).astype(np.uint8)

r_in = max(4, round(W * .022))     # насколько глубоко внутрь силуэта проверяем (пятна фона в прядях)
r_bg = max(6, round(W * .02))      # отступ наружу, откуда берём цвет фона
k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
sure_fg = cv2.erode(m, k(r_in))
sure_bg = 1 - cv2.dilate(m, k(r_bg))
band = (m == 1) & (sure_fg == 0)   # полоса только ВНУТРИ силуэта: снаружи ничего не добавляем


def local_mean(mask, sigma):
    """Средний цвет исходного фото по ближайшим пикселям маски (нормированное размытие)."""
    w = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), sigma)
    s = cv2.GaussianBlur(img * mask[..., None].astype(np.float32), (0, 0), sigma)
    return s / np.maximum(w, 1e-4)[..., None], w


F, wf = local_mean(sure_fg, r_in * 1.6)
B, wb = local_mean(sure_bg, r_bg * 2.5)
d = F - B
dist = np.sqrt((d * d).sum(axis=2))
proj = ((img - B) * d).sum(axis=2) / np.maximum(dist * dist, 1.0)          # 0 – цвет фона, 1 – цвет человека
# Осторожное правило: пиксель убирается, только если он явно цвета фона (proj мал) И фон в этом месте заметно отличается от человека.
# Убираем именно светлые пятна: фон в этом месте светлый, а пиксель почти такой же яркий, как фон.
# На тёмном фоне (ведущий) тёмные волосы от фона по цвету не отличить – там маска остаётся как есть.
bgness = np.clip((.34 - proj) / .24, 0, 1)
strong = np.clip((dist - 55) / 45, 0, 1) * np.clip(wf * 40, 0, 1) * np.clip(wb * 40, 0, 1)
lum = lambda x: x[..., 0] * .299 + x[..., 1] * .587 + x[..., 2] * .114
light_bg = np.clip((lum(B) - 140) / 40, 0, 1)
near_bg = np.clip((lum(img) - (lum(B) - 45)) / 25, 0, 1)
strong = strong * light_bg
same = np.clip((46 - np.sqrt(((img - B) ** 2).sum(axis=2))) / 16, 0, 1)     # пиксель действительно цвета фона (светлая прядь – не фон)
cut = np.where(band, bgness * strong * near_bg * same, 0.0)
# Режим deep:<доля высоты> (четвёртый аргумент, например deep:0.52): фото с длинными тёмными волосами на светлом фоне.
# Между прядями, шеей и воротником остаются замкнутые островки фона дальше от контура, чем основная полоса.
# Ищем их в широкой полосе и только выше указанной доли высоты кадра (ниже могут быть белые детали одежды):
# «зерно» – точное совпадение с цветом фона, от него островок растёт по соседним светло-серым пикселям (волосы тёмные, кожа цветная – туда не затечёт).
# Для фото со светлыми волосами или светлой рубашкой у края силуэта режим не включать.
if len(sys.argv) > 4 and sys.argv[4].startswith("deep"):
    ymax = float(sys.argv[4].split(":")[1]) if ":" in sys.argv[4] else 1.0
    r_wide = round(W * .085)
    zone = (m == 1) & (cv2.erode(m, k(r_wide)) == 0) & (np.arange(H)[:, None] < H * ymax)
    B2, _ = local_mean(sure_bg, r_bg * 6.0)
    seed = zone & (np.sqrt(((img - B2) ** 2).sum(axis=2)) < 30) & (lum(B2) > 150)
    seed = cv2.morphologyEx(seed.astype(np.uint8), cv2.MORPH_OPEN, k(2)) == 1          # одиночные блики – не зерно
    greyish = zone & (lum(img) > 140) & ((img.max(axis=2) - img.min(axis=2)) < 30)
    n, lab = cv2.connectedComponents((greyish | seed).astype(np.uint8), connectivity=8)
    keep = np.zeros(n, bool)
    keep[np.unique(lab[seed])] = True
    keep[0] = False
    isl = keep[lab].astype(np.uint8)
    isl = cv2.GaussianBlur(cv2.dilate(isl, k(2)).astype(np.float32), (0, 0), 1.5)
    cut = np.maximum(cut, np.where(m == 1, isl, 0.0))
    print("deep: островков фона", int((isl > .5).sum()), "пикс.")
# край исходной маски слегка поджимаем и сглаживаем: уходит тонкая светлая кайма по контуру
e = max(1, round(W * .0022))
a0 = cv2.GaussianBlur(cv2.erode(m, k(e)).astype(np.float32), (0, 0), max(.8, e * .7))
a = a0 * (1 - cut)
a = cv2.GaussianBlur(a, (0, 0), .6)

# цвет на краю: убираем примесь старого фона там, где он отличим
aa = np.maximum(a, .35)[..., None]
clean = np.clip((img - (1 - aa) * B) / aa, 0, 255)
mix = (np.clip((1 - a) * 2.0, 0, 1) * strong)[..., None]
rgb = np.where(band[..., None], img * (1 - mix) + clean * mix, img)
res = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
Image.fromarray(res, "RGBA").save(out)
print(out, f"{W}x{H}", "полоса", int(band.sum()), "пикс., убрано как фон", int(((a < .5) & (a0 >= .5)).sum()))
