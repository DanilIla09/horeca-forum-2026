"""Цветные версии логотипов для светлого первого экрана (фон «слоновая кость»).
Исходники белые на прозрачном фоне; геометрия не меняется, красится только цвет, прозрачность остаётся прежней.
python recolor.py <папка assets/logo>        (нужны pillow и numpy)"""
import sys
import numpy as np
from PIL import Image

d = sys.argv[1].rstrip("/") + "/"
RED = (175, 0, 0)            # красный сайта #AF0000 (--red)
CCI_RED = (175, 0, 0)        # красный сайта; фирменный красный CCI был (217, 47, 57)
CCI_GREY = (61, 76, 82)


def paint(src, dst, color):
    a = np.array(Image.open(d + src).convert("RGBA"))
    a[..., 0], a[..., 1], a[..., 2] = color
    Image.fromarray(a, "RGBA").save(d + dst, optimize=True)
    print(dst, a.shape[1], "x", a.shape[0])


paint("horeca-forum-2026-white.png", "horeca-forum-2026-red.png", RED)
paint("logo-text.png", "logo-text-red.png", RED)

# CCI: бутылка и буквы CCI красные, слово KAZAKHSTAN серое (строки ниже 411 px в файле 900×506)
a = np.array(Image.open(d + "cci-white.png").convert("RGBA"))
assert a.shape[:2] == (506, 900), a.shape
a[..., 0], a[..., 1], a[..., 2] = CCI_RED
low = np.zeros(a.shape[:2], bool)
low[411:, 166:] = True       # правее бутылки (она кончается на x=138) и ниже букв CCI (они кончаются на y=394)
a[low, 0], a[low, 1], a[low, 2] = CCI_GREY
Image.fromarray(a, "RGBA").save(d + "cci-color.png", optimize=True)
print("cci-color.png 900 x 506")
